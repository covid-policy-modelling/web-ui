import {withDB} from '../../lib/mysql'
import dispatch from './util/dispatch'
import {fetchData} from '../../lib/data/fetch'

export default withDB(conn =>
  dispatch('POST', async (req, res) => {
    const {RUNNER_SHARED_SECRET} = process.env
    const AUTH = req.headers?.authorization?.split(' ')[1]

    if (RUNNER_SHARED_SECRET != AUTH) {
      res.status(401).end('Unauthorized')
      return
    }

    const isError = await fetchData(conn, null, false, false)

    if (isError) {
      res.status(500).end('Error')
    }

    res.json({ok: true})
  })
)
