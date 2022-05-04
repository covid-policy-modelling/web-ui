import assert from 'assert'
import {NextApiRequest} from 'next'
import 'source-map-support/register'
import {assertEnv} from 'lib/assertions'
import {getSimulation, updateSimulation} from 'lib/db'
import {catchUnhandledErrors} from 'lib/handle-error'
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
       * @oas [get] /simulations/{id}
       * description: Retrieves simulation summary
       * parameters:
       *   - (path) id=84* {integer} Simulation ID
       * responses:
       *   200:
       *    description: Successful operation
       *    content:
       *      application/json; charset=utf-8:
       *        schema:
       *          $ref: "#/components/schemas/Simulation"
       * operationId: getSimulation
       * tags: ["simulations"]
       */
      const sim = await getSimulation(conn, session.user, {
        id: parseInt(req.query.id as string)
      })

      if (!sim) {
        res.status(404).json({error: 'Not found'})
        return
      }

      res.status(200).json(sim)
    }),
    post: async (req, res) => {
      if (!validateRequest(req)) {
        res.status(401).json({error: 'Unauthorized'})
        return
      }

      try {
        verifyStatus(req.body.status)

        const updated = await updateSimulation(
          conn,
          req.query.id as string,
          req.body.status,
          req.body.modelSlug,
          req.body.resultsLocation,
          req.body.exportLocation,
          req.body.workflowRunID
        )

        if (updated) {
          res.status(204).end()
        } else {
          res.status(404).end('Not found')
        }
      } catch (e) {
        res.status(400).json({error: `Could not process message: ${e.message}`})
      }
    }
  })
)

function verifyStatus(status: RunStatus) {
  assert(
    Object.values(RunStatus).includes(status),
    new Error(`Invalid status: ${status}`)
  )
  return status
}

function validateRequest(req: NextApiRequest) {
  const auth = req.headers.authorization
  const authToken =
    auth?.startsWith('Bearer ') && auth.slice('Bearer '.length).trim()
  return authToken === RUNNER_SHARED_SECRET
}
