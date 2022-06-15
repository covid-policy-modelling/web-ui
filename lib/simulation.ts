import * as zlib from 'zlib'
import {RunStatus} from '@covid-policy-modelling/api'
import {ModelInput} from '@covid-policy-modelling/api/input'
import {CommonModelInput} from '@covid-policy-modelling/api/input-common'
import {PoolConnection} from 'mysql2/promise'
import 'source-map-support/register'
import SQL from 'sql-template-strings'
import {assertEnv} from 'lib/assertions'
import {toYYYYMMDD} from 'lib/dateFunctions'
import {createSimulation, getRegionCaseData, updateSimulation} from 'lib/db'
import {createClient, repositoryDispatch} from 'lib/github'
import models, {ModelSpec, modelSupports} from 'lib/models'
import {NewSimulationConfig} from 'lib/simulation-types'
import {Session} from 'lib/session'
import dispatch from 'pages/api/util/dispatch'

export class UserError extends Error {}

const CONTROL_REPO_NWO = assertEnv('CONTROL_REPO_NWO', true)
const GITHUB_API_TOKEN = assertEnv('GITHUB_API_TOKEN', true)
const RUNNER_CALLBACK_URL = assertEnv('RUNNER_CALLBACK_URL', true)
const CONTROL_REPO_EVENT_TYPE = assertEnv('CONTROL_REPO_EVENT_TYPE', true)

export type ModelSpecList = [string, ModelSpec][]

export function supportedModelsFor(
  slug?: string,
  region?: string,
  subregion?: string
): {supportedModels: ModelSpecList; unsupportedModels: ModelSpecList} {
  const supportedModels: ModelSpecList = []
  const unsupportedModels: ModelSpecList = []
  for (const [modelSlug, spec] of Object.entries(models)) {
    if (slug === modelSlug) {
      supportedModels.push([modelSlug, spec])
    } else if (region && modelSupports(spec, [region, subregion])) {
      supportedModels.push([modelSlug, spec])
    } else {
      unsupportedModels.push([modelSlug, spec])
    }
  }
  return {supportedModels, unsupportedModels}
}

export async function createModelInput(
  conn: PoolConnection,
  user: Session['user'],
  config: NewSimulationConfig
): Promise<CommonModelInput> {
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

  const modelInput: CommonModelInput = {
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

export async function createAndDispatchSimulation(
  conn: PoolConnection,
  user: Session['user'],
  regionID: string | null,
  subregionID: string | null,
  modelInput: ModelInput,
  supportedModels: ModelSpecList,
  unsupportedModels: ModelSpecList,
  label: string | null
): Promise<number> {
  await conn.query(SQL`START TRANSACTION`)

  const {insertId} = await createSimulation(conn, {
    region_id: regionID,
    subregion_id: subregionID,
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
        `file://${process.cwd()}/data/${slug}-stub.json`,
        undefined
      )
    }
  } else {
    const [owner, name] = CONTROL_REPO_NWO.split('/')
    const client = createClient({token: GITHUB_API_TOKEN})

    try {
      const rawConfig = JSON.stringify(modelInput)
      const compressed = zlib.gzipSync(rawConfig)
      const encoded = compressed.toString('base64')
      await repositoryDispatch(client, owner, name, CONTROL_REPO_EVENT_TYPE, {
        id: insertId,
        models: supportedModels.map(([slug, spec]) => ({
          slug,
          imageURL: spec.imageURL
        })),
        configurationCompressed: encoded,
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
