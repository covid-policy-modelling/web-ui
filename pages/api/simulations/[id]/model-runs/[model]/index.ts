import assert from 'assert'
import {NextApiRequest} from 'next'
import 'source-map-support/register'
import {OpenAPIV3} from 'openapi-types'
import {assertEnv} from 'lib/assertions'
import {getSimulation, updateSimulation} from 'lib/db'
import {catchUnhandledErrors} from 'lib/handle-error'
import {ModelSpec} from 'lib/models'
import {withDB} from 'lib/mysql'
import {Session} from 'lib/session'
import {RunStatus} from 'lib/simulation-types'
import dispatch from 'pages/api/util/dispatch'
import requireSession from 'pages/api/util/require-session'

catchUnhandledErrors()

const RUNNER_SHARED_SECRET = assertEnv('RUNNER_SHARED_SECRET', true)

export default withDB(conn =>
  dispatch({
    get: requireSession((session: Session) => async (req, res) => {
      /*
       * @oas [get] /simulations/{id}/model-runs/{model}
       * description: Retrieves model run summary
       * parameters:
       *   - (path) id=84* {integer} Simulation ID
       *   - in: path
       *     name: model
       *     description: Model slug
       *     schema:
       *       type: string
       *       $ref: "#/components/schemas/ModelSlug"
       *       default: mrc-ide-covid-sim
       * responses:
       *   200:
       *    description: Successful operation
       *    content:
       *      application/json; charset=utf-8:
       *        schema:
       *          $ref: "#/components/schemas/ModelRun"
       * operationId: getSimulation
       * tags: ["model-runs"]
       */
      const sim = await getSimulation(conn, session.user, {
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

      if (!modelRun) {
        res.status(404).json({error: 'Not found'})
        return
      }

      res.status(200).json(modelRun)
    })
  })
)
