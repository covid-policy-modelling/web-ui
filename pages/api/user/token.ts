import * as crypto from 'crypto'
import JWT from 'jsonwebtoken'
import {assertEnv} from '../../../lib/assertions'
import * as db from '../../../lib/db'
import {withDB} from '../../../lib/mysql'
import dispatch from '../util/dispatch'
import requireSession, {Claims} from '../util/require-session'

const SESSION_SECRET = assertEnv('SESSION_SECRET')

export default withDB(conn =>
  requireSession(ssn =>
    dispatch('POST', async (req, res) => {
      /*
       * @oas [post] /user/token
       * description: |-
       *   Generates API token for use in other API endpoints.
       *   Please note that generating a new token will invalidate any existing tokens.
       *   You should not share your token, and should keep your token safe and secure, e.g. using a password manager.
       *   Your token cannot be retrieved if it is lost, it must be regenerated.
       * responses:
       *   200:
       *    description: successful operation
       *    content:
       *      application/json:
       *        schema:
       *          type: object
       *          required:
       *            - token
       *          properties:
       *            token:
       *              type: string
       * operationId: getUserToken
       * tags: ["users"]
       */
      const jti = await db.updateUserTokenId(conn, ssn.user.login)
      if (!jti) {
        res.status(404).end('Not found')
        return
      }
      const claims: Claims = {
        sub: ssn.user.id,
        login: ssn.user.login,
        jti: jti
      }
      const token = JWT.sign(claims, SESSION_SECRET, {
        algorithm: 'HS256',
        expiresIn: '30d'
      })
      res.status(200).json({token})
    })
  )
)
