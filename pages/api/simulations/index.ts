import {ModelInput} from '@covid-policy-modelling/api/input'
import Jsen from 'jsen'
import 'source-map-support/register'
import {listSimulationSummaries} from 'lib/db'
import {catchUnhandledErrors} from 'lib/handle-error'
import {withDB} from 'lib/mysql'
import {validateSchema} from 'lib/new-simulation-state'
import {NewSimulationConfig} from 'lib/simulation-types'
import {Session} from 'lib/session'
import {
  supportedModelsFor,
  createAndDispatchSimulation,
  createModelInput,
  ModelSpecList,
  UserError
} from 'lib/simulation'
import dispatch from 'pages/api/util/dispatch'
import requireSession from 'pages/api/util/require-session'

catchUnhandledErrors()

const validateInputSchema = Jsen(
  require('@covid-policy-modelling/api/schema/input.json')
)

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
         *       example:
         *         regionID: "US"
         *         subregionID: "US-AK"
         *         label: "Simulation"
         *         customCalibrationDate: "2020-03-06"
         *         interventionPeriods:
         *           - startDate: "2020-03-06"
         *             socialDistancing: "aggressive"
         *             schoolClosure: "aggressive"
         *             caseIsolation: "aggressive"
         *             voluntaryHomeQuarantine: "aggressive"
         *             reductionPopulationContact: 0
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

        try {
          const config: NewSimulationConfig = req.body
          const error = validateSchema(config)
          if (error) {
            throw new UserError(error.message)
          }

          const modelInput = await createModelInput(conn, session.user, config)
          if (!validateInputSchema(modelInput)) {
            throw new Error(
              `Invalid model runner input JSON. Details: ${JSON.stringify(
                validateInputSchema.errors
              )}`
            )
          }

          const {supportedModels, unsupportedModels} = supportedModelsFor(
            undefined,
            config.regionID,
            config.subregionID
          )

          const label = config.label
          const regionID = config.regionID
          const subregionID = config.subregionID ?? null

          const insertId = await createAndDispatchSimulation(
            conn,
            session.user,
            regionID,
            subregionID,
            modelInput,
            supportedModels,
            unsupportedModels,
            label
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
