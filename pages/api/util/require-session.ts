import JWT from 'jsonwebtoken'
import {assertEnv} from '../../../lib/assertions'
import {isAuthorizedUser} from '../../../lib/db'
import {createClient, getUser} from '../../../lib/github'
import {withDB} from '../../../lib/mysql'
import {getSessionCookie, Session} from '../../../lib/session'
import {AsyncNextApiHandler} from '../types/async-next-api-handler'

const SESSION_SECRET = assertEnv('SESSION_SECRET')

export interface Claims {
  sub: string
  login: string
  jti: number
}

export default function requireSession(
  cb: (session: Session) => AsyncNextApiHandler
): AsyncNextApiHandler {
  return withDB(conn => async (req, res) => {
    let session = getSessionCookie(req, res)
    if (!session) {
      let auth = req.headers.authorization
      if (auth) {
        auth = auth.replace(/^(bearer|token)\s*/i, '')
        try {
          const decoded = JWT.verify(auth, SESSION_SECRET, {
            algorithms: ['HS256'],
            maxAge: '30d'
          }) as Claims
          if (
            await isAuthorizedUser(
              conn,
              decoded.login.toLowerCase(),
              decoded.jti
            )
          ) {
            session = {user: {id: decoded.sub, login: decoded.login}}
          }
        } catch (err) {
          console.log(err)
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
