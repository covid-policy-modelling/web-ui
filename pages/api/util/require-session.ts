import {isAuthorizedUser} from '../../../lib/db'
import {createClient, getUser} from '../../../lib/github'
import {withDB} from '../../../lib/mysql'
import {getSessionCookie, Session} from '../../../lib/session'
import {AsyncNextApiHandler} from '../types/async-next-api-handler'

export default function requireSession(
  cb: (session: Session) => AsyncNextApiHandler
): AsyncNextApiHandler {
  return withDB(conn => async (req, res) => {
    let session = getSessionCookie(req, res)
    if (!session) {
      let auth = req.headers.authorization
      if (auth) {
        auth = auth.replace(/^(bearer|token)/i, '')
        const client = createClient({token: auth})
        const user = await getUser(client)
        if (await isAuthorizedUser(conn, user.login.toLowerCase())) {
          session = {user: {id: user.id, login: user.login}}
        }
      }
    }

    if (!session) {
      res.status(401).end('Unauthorized')
    } else {
      return cb(session)(req, res)
    }
  })
}
