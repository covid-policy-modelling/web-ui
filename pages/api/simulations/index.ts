import {input, RunStatus} from '@covid-policy-modelling/api'
import * as jsonSchema from 'jsen'
import {PoolConnection} from 'mysql2/promise'
import 'source-map-support/register'
import SQL from 'sql-template-strings'
import {assertEnv} from '../../../lib/assertions'
import {toYYYYMMDD} from '../../../lib/dateFunctions'
import {
  createSimulation,
  getRegionCaseData,
  listSimulationSummaries,
  updateSimulation
} from '../../../lib/db'
import {createClient, repositoryDispatch} from '../../../lib/github'
import {catchUnhandledErrors} from '../../../lib/handle-error'
import models, {ModelSpec, modelSupports} from '../../../lib/models'
import {withDB} from '../../../lib/mysql'
import {validateSchema} from '../../../lib/new-simulation-state'
import {NewSimulationConfig} from '../../../lib/simulation-types'
import {Session} from '../../../lib/session'
import dispatch from '../util/dispatch'
import requireSession from '../util/require-session'

catchUnhandledErrors()

const CONTROL_REPO_NWO = assertEnv('CONTROL_REPO_NWO', true)
const GITHUB_API_TOKEN = assertEnv('GITHUB_API_TOKEN', true)
const RUNNER_CALLBACK_URL = assertEnv('RUNNER_CALLBACK_URL', true)
const CONTROL_REPO_EVENT_TYPE = assertEnv('CONTROL_REPO_EVENT_TYPE', true)

const validateInputSchema = jsonSchema(
  require('@covid-policy-modelling/api/schema/input.json')
)

export class UserError extends Error {}

export default withDB(conn =>
  requireSession((session: Session) =>
    dispatch({
      get: async (_req, res) => {
        /*
         * @oas [get] /simulations
         * description: Retrieves list of simulations
         * responses:
         *   200:
         *    description: Successful operation
         *    content:
         *      application/json; charset=utf-8:
         *        schema:
         *          type: array
         *          items:
         *            $ref: "#/components/schemas/SimulationSummary"
         * operationId: getSimulations
         * tags: ["simulations"]
         */
        const summaries = await listSimulationSummaries(conn, session.user.id)
        res.status(200).json(summaries)
      },
      post: async (req, res) => {
        /*
         * @oas [post] /simulations
         * description: Schedule new simulation
         * requestBody:
         *   content:
         *     application/json:
         *       schema:
         *         "$ref": "#/components/schemas/NewSimulationConfig"
         * responses:
         *   200:
         *     description: Successful operation
         *     content:
         *       application/json; charset=utf-8:
         *         schema:
         *           type: object
         *           required:
         *             - id
         *           properties:
         *             id:
         *               type: integer
         *   422:
         *     description: Invalid configuration
         *     content:
         *       application/json; charset=utf-8:
         *         schema:
         *           type: object
         *           required:
         *             - error
         *           properties:
         *             error:
         *               type: string
         * operationId: postSimulations
         * tags: ["simulations"]
         */
        const config: NewSimulationConfig = req.body

        try {
          const error = validateSchema(config)
          if (error) {
            throw new UserError(error.message)
          }

          const modelInput = await createModelInput(conn, session.user, config)
          const {supportedModels, unsupportedModels} = supportedModelsFor(
            config.regionID,
            config.subregionID
          )

          const insertId = await createAndDispatchSimulation(
            conn,
            session.user,
            modelInput,
            supportedModels,
            unsupportedModels,
            config.label
          )
          res.status(200).json({id: insertId})
        } catch (err) {
          if (err instanceof UserError) {
            res.status(422).json({error: err.message})
          } else {
            console.error(err)
            res.status(500).json({error: 'Error queueing simulation run'})
          }
        }
      }
    })
  )
)

type ModelSpecList = [string, ModelSpec][]

function supportedModelsFor(
  region: string,
  subregion?: string
): {supportedModels: ModelSpecList; unsupportedModels: ModelSpecList} {
  const supportedModels: ModelSpecList = []
  const unsupportedModels: ModelSpecList = []
  for (const [slug, spec] of Object.entries(models)) {
    if (modelSupports(spec, [region, subregion])) {
      supportedModels.push([slug, spec])
    } else {
      unsupportedModels.push([slug, spec])
    }
  }
  return {supportedModels, unsupportedModels}
}

async function createModelInput(
  conn: PoolConnection,
  user: Session['user'],
  config: NewSimulationConfig
): Promise<input.ModelInput> {
  // TODO should we be failing the run of there is no case data?
  const {endDate, deaths, confirmed} = await getRegionCaseData(
    conn,
    config.regionID,
    config.subregionID,
    config.customCalibrationDate
  )

  // If a custom calibration date is specified, but we have no data for that date,
  // then throw an error
  if (
    config.customCalibrationDate &&
    (endDate === null || deaths === null || confirmed === null)
  ) {
    throw new UserError(
      `Calibration data is not available for ${config.customCalibrationDate}. Please choose a different date.`
    )
  }

  const modelInput: Omit<input.ModelInput, 'model'> = {
    region: config.regionID,
    subregion: config.subregionID,
    parameters: {
      r0: typeof config.r0 == 'number' ? config.r0 : null,
      calibrationCaseCount: confirmed || 0,
      calibrationDeathCount: deaths || 0,
      calibrationDate: endDate || toYYYYMMDD(),
      interventionPeriods: config.interventionPeriods
    }
  }
  return modelInput
}

async function createAndDispatchSimulation(
  conn: PoolConnection,
  user: Session['user'],
  modelInput: input.ModelInput,
  supportedModels: ModelSpecList,
  unsupportedModels: ModelSpecList,
  label: string
): Promise<number> {
  if (!validateInputSchema(modelInput)) {
    throw new Error(
      `Invalid model runner input JSON. Details: ${JSON.stringify(
        validateInputSchema.errors
      )}`
    )
  }
  await conn.query(SQL`START TRANSACTION`)

  const {insertId} = await createSimulation(conn, {
    region_id: modelInput.region,
    subregion_id: modelInput.subregion,
    status: RunStatus.Pending,
    github_user_id: user.id,
    github_user_login: user.login,
    label: label,
    configuration: modelInput
  })

  for (const [slug, spec] of unsupportedModels) {
    await updateSimulation(
      conn,
      insertId.toString(),
      RunStatus.Unsupported,
      slug,
      '',
      '',
      undefined
    )
  }

  if (process.env.LOCAL_MODE) {
    for (const [slug, spec] of supportedModels) {
      await updateSimulation(
        conn,
        insertId.toString(),
        RunStatus.Complete,
        slug,
        `file://${process.cwd()}/data/${slug}-stub.json`,
        '',
        undefined
      )
    }
  } else {
    const [owner, name] = CONTROL_REPO_NWO.split('/')
    const client = createClient({token: GITHUB_API_TOKEN})

    try {
      await repositoryDispatch(client, owner, name, CONTROL_REPO_EVENT_TYPE, {
        id: insertId,
        models: supportedModels.map(([slug, spec]) => ({
          slug,
          imageURL: spec.imageURL
        })),
        configuration: modelInput,
        callbackURL: RUNNER_CALLBACK_URL
      })
    } catch (err) {
      await conn.query('ROLLBACK')
      throw err
    }
  }

  await conn.query('COMMIT')

  return insertId
}
