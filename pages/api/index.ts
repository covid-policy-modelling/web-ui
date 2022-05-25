import models from 'lib/models'
import dispatch from 'pages/api/util/dispatch'

const docs = require('../../public/openapi.json')

export default dispatch('GET', async (req, res) => {
  docs['components']['schemas']['ModelSlug']['enum'] = Object.keys(models)
  res.json(docs)
})
