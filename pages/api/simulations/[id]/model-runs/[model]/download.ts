import {
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol
} from '@azure/storage-blob'
import {DateTime} from 'luxon'
import {OpenAPIV3} from 'openapi-types'
import {getSimulation} from 'lib/db'
import {ModelSpec} from 'lib/models'
import {withDB} from 'lib/mysql'
import {
  getContainerClient,
  getSharedKeyCredential
} from 'pages/api/util/blob-storage'
import dispatch from 'pages/api/util/dispatch'
import requireSession from 'pages/api/util/require-session'

export default dispatch(
  'GET',
  withDB(conn =>
    requireSession(ssn => async (req, res) => {
      /*
       * @oas [get] /simulations/{id}/model-runs/{model}/download
       * description: Downloads full result of simulation
       * parameters:
       *   - (path) id=2* {integer} Simulation ID
       *   - in: path
       *     name: model
       *     description: Model slug
       *     schema:
       *       type: string
       *       $ref: "#/components/schemas/ModelSlug"
       * responses:
       *   307:
       *    description: Successful redirect
       *    headers:
       *      Location:
       *        description: The URL to download results from
       *        schema:
       *          type: string
       * operationId: getSimulationDownload
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

      if (!modelRun || !modelRun.export_location) {
        res.status(404).json({error: 'Not found'})
        return
      }

      const url = getSharedBlobURL(modelRun.export_location)
      res.writeHead(307, {location: url}).end('Temporary redirect')
    })
  )
)

function getSharedBlobURL(path: string): string {
  const now = new Date()
  const expires = DateTime.fromJSDate(now)
    .plus({minutes: 10})
    .toJSDate()

  const containerClient = getContainerClient()

  const blob = containerClient.getBlobClient(path)

  const containerSAS = generateBlobSASQueryParameters(
    {
      containerName: containerClient.containerName,
      permissions: ContainerSASPermissions.parse('r'),
      startsOn: now,
      expiresOn: expires,
      protocol: SASProtocol.Https
    },
    getSharedKeyCredential()
  ).toString()

  return `${blob.url}?${containerSAS}`
}
