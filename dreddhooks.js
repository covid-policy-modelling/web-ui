const hooks = require('hooks')

hooks.before(
  '/user/token > POST > 200 > application/json; charset=utf-8',
  transaction => {
    transaction.skip = true
  }
)
hooks.before(
  '/simulations > POST > 422 > application/json; charset=utf-8',
  transaction => {
    transaction.request.body = ''
  }
)
