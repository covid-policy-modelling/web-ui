const hooks = require('hooks')
const clone = require('clone')

// See below about multiple examples
hooks.beforeAll((transactions, done) => {
  const cloned = []
  for (transaction of transactions) {
    const name = transaction.name
    if (name == '/simulations > POST > 200 > application/json; charset=utf-8') {
      transaction.name = name + ' > 1'
      t2 = clone(transaction)
      t2.name = name + ' > 2'
      cloned.push(t2)
    }
  }
  transactions.push(...cloned)
  done()
})

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

// Again, there's no support for multiple examples - Dredd always picks the first one
// That means we have to a) generate an additional transaction and b) hard-code in the body
hooks.before(
  '/simulations > POST > 200 > application/json; charset=utf-8 > 2',
  transaction => {
    transaction.request.body =
      '{"regionID":"US","subregionID":"US-AK","label":"Simulation","customCalibrationDate":"2020-03-06","interventionPeriods":[{"startDate":"2020-03-06","socialDistancing":"aggressive","schoolClosure":"aggressive","caseIsolation":"aggressive","voluntaryHomeQuarantine":"aggressive","reductionPopulationContact":0}]}'
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
