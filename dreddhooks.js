const hooks = require('hooks')
const clone = require('clone')

// Calling this would generate a new token, which would invalidate the old one
hooks.before(
  '/user/token > POST > 200 > application/json; charset=utf-8',
  transaction => {
    transaction.skip = true
  }
)

// There's no way to pair responses + requests with OpenAPI 3, so to test multiple responses
// we need to manipulate the request
// In this case, we just want to test the response to an invalid request
hooks.before(
  '/simulations > POST > 422 > application/json; charset=utf-8',
  transaction => {
    transaction.request.body = ''
  }
)

hooks.before(
  '/simulations/{id}/export > GET > 200 > application/json; charset=utf-8',
  transaction => {
    transaction.fullPath += '&format=results'
  }
)

hooks.before('/simulations/{id}/export > GET > 200 > text/csv', transaction => {
  transaction.fullPath += '&format=crystalcast'
})
