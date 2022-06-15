import clone from 'clone'
import {OpenAPIV3} from 'openapi-types'
import Jsen from 'jsen'
import 'source-map-support/register'
import {catchUnhandledErrors} from 'lib/handle-error'
import models, {ModelSpec, supportedInputSchema} from 'lib/models'
import {withDB} from 'lib/mysql'
import {Session} from 'lib/session'
import {
  supportedModelsFor,
  createAndDispatchSimulation,
  UserError
} from 'lib/simulation'
import dispatch from 'pages/api/util/dispatch'
import requireSession from 'pages/api/util/require-session'

catchUnhandledErrors()

const schema = require('@covid-policy-modelling/api/schema/input.json')

export default withDB(conn =>
  requireSession((session: Session) =>
    dispatch({
      post: async (req, res) => {
        /*
         * @oas [post] /simulations/model-runs/{model}
         * description: Schedule new model run
         * parameters:
         *   - in: path
         *     name: model
         *     description: Model slug
         *     schema:
         *       type: string
         *       $ref: "#/components/schemas/ModelSlug"
         *       default: mrc-ide-covid-sim
         * requestBody:
         *   content:
         *     application/json:
         *       schema:
         *         "$ref": "#/components/schemas/ModelInput"
         *       examples:
         *         custom:
         *           summary: Run simulation for a single model using a custom format
         *           value:
         *             p : [0.5,0.25]
         *             u0 : [0.99,0.01,0.0]
         *             tspan : [0.0,10000.0]
         *         common:
         *           summary: Run simulation for a single model using the common format with complete control over parameters
         *           value:
         *             region: "US"
         *             subregion: "US-AK"
         *             parameters:
         *               calibrationDate: "2020-03-06"
         *               calibrationCaseCount: 0
         *               calibrationDeathCount: 0
         *               r0: null
         *               interventionPeriods:
         *                 - startDate: "2020-03-06"
         *                   socialDistancing: "aggressive"
         *                   schoolClosure: "aggressive"
         *                   caseIsolation: "aggressive"
         *                   voluntaryHomeQuarantine: "aggressive"
         *                   reductionPopulationContact: 0
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
         * operationId: postModelRun
         * tags: ["model-runs"]
         */

        try {
          const modelInput = req.body
          const modelId = req.query.model as string
          const model = models[modelId]
          if (model === undefined) {
            res.status(404).json({error: 'Model slug not valid'})
            return
          }
          const modelSchema = clone(schema)
          const supportedSchema = supportedInputSchema(model)
          modelSchema['definitions']['ModelInput'] = {
            $ref: `#/definitions/${supportedSchema}`
          }
          const validateInputSchema = Jsen(modelSchema)

          if (!validateInputSchema(modelInput)) {
            throw new UserError(
              `Invalid model runner input JSON. Details: ${JSON.stringify(
                validateInputSchema.errors
              )}`
            )
          }
          const {supportedModels, unsupportedModels} = supportedModelsFor(
            modelId
          )

          const label = null
          const regionID = null
          const subregionID = null

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

export function expandDocsFor(
  pathItem: OpenAPIV3.PathItemObject,
  model: ModelSpec
) {
  const requestBody = pathItem.post!.requestBody as OpenAPIV3.RequestBodyObject
  delete requestBody.content['application/json'].examples
  const supportedSchema = supportedInputSchema(model)
  requestBody.content['application/json'].schema = {
    $ref: `#/components/schemas/${supportedSchema}`
  }
}
