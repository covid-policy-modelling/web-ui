import {OpenAPIV3} from 'openapi-types'
import {ModelOutput} from '@covid-policy-modelling/api/output'
import {CommonModelOutput} from '@covid-policy-modelling/api/output-common'
import {getSimulation} from 'lib/db'
import {
  ModelSpec,
  supportedOutputSchema,
  SupportedOutputSchema
} from 'lib/models'
import {withDB} from 'lib/mysql'
import {exportCsv} from 'lib/crystalcast'
import {ExportFormat} from 'lib/simulation-types'
import {getBlob} from 'pages/api/util/blob-storage'
import dispatch from 'pages/api/util/dispatch'
import requireSession from 'pages/api/util/require-session'

export default dispatch(
  'GET',
  withDB(conn =>
    requireSession(ssn => async (req, res) => {
      /*
       * @oas [get] /simulations/{id}/model-runs/{model}/export
       * description: Downloads full result of simulation
       * parameters:
       *   - (path) id=84* {integer} Simulation ID
       *   - in: query
       *     name: model
       *     description: Model slug
       *     schema:
       *       type: string
       *       $ref: "#/components/schemas/ModelSlug"
       *   - in: query
       *     name: format
       *     description: "Determines what data and media type to return:\n
       *                   \n
       *                   * results -> application/json\n
       *                   * crystalcast -> text/csv"
       *     default: results
       *     schema:
       *       type: string
       *       $ref: "#/components/schemas/ExportFormat"
       * responses:
       *   200:
       *    description: Successful export
       *    content:
       *      application/json; charset=utf-8:
       *        schema:
       *          "$ref": "#/components/schemas/ModelOutput"
       *      text/csv:
       *        schema:
       *          type: string
       *        examples:
       *          success:
       *            externalValue: /export-example.csv
       * operationId: getSimulationExport
       * tags: ["model-runs"]
       */
      const sim = await getSimulation(conn, ssn.user, {
        id: parseInt(req.query.id as string)
      })

      if (!sim) {
        res.status(404).json({error: 'Not found'})
        return
      }

      const modelRun = sim.model_runs.find(
        run =>
          run.model_slug.toLowerCase() ===
          (req.query.model as string).toLowerCase()
      )

      if (!modelRun || !modelRun.results_data) {
        res.status(404).json({error: 'Not found'})
        return
      }

      const resultsData = await getBlob(modelRun.results_data)
      const modelOutput = JSON.parse(resultsData!) as ModelOutput

      switch (req.query.format) {
        case ExportFormat.CrystalCast:
          const csv = exportCsv(
            sim,
            modelRun.model_slug,
            modelOutput as CommonModelOutput
          )
          res.setHeader('Content-Type', 'text/csv')
          res.status(200).send(csv)
          return
        case ExportFormat.Results:
        case undefined:
          res.status(200).json(modelOutput)
          return
        default:
          res.status(422).json({error: 'Invalid format'})
          return
      }
    })
  )
)

export function expandDocsFor(
  pathItem: OpenAPIV3.PathItemObject,
  model: ModelSpec
) {
  const response = pathItem.get!.responses['200'] as OpenAPIV3.ResponseObject
  const supportedSchema = supportedOutputSchema(model)
  response.content!['application/json; charset=utf-8'].schema = {
    $ref: `#/components/schemas/${supportedSchema}`
  }
  if (supportedSchema !== SupportedOutputSchema.CommonModelOutput) {
    pathItem.get!.parameters = pathItem.get!.parameters!.filter(
      p => (p as OpenAPIV3.ParameterObject).name !== 'format'
    )
    delete response.content!['text/csv']
  }
}
