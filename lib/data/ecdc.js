const _ = require('lodash')
const {DateTime} = require('luxon')

export const ecdcCasesURL = `https://opendata.ecdc.europa.eu/covid19/casedistribution/json/`

function toISODate(dateRep) {
  return DateTime.fromFormat(dateRep, 'dd/MM/yyyy').toISODate()
}

export function parse(ecdcCasesJSON) {
  // Parse the non-us case data
  const ecdcCases = JSON.parse(ecdcCasesJSON).records
  const worldRows = _.chain(ecdcCases)
    // Group by country
    .groupBy('geoId')
    // Sort the per day entries so that we can calculate the cumulative values correctly.
    .mapValues(v => _.sortBy(v, [v => toISODate(v.dateRep)]))
    .mapValues(v =>
      _.reduce(
        v,
        (acc, o) => {
          const preCumCases =
            acc.length !== 0 ? acc[acc.length - 1].cumCases : 0
          const preCumDeaths =
            acc.length !== 0 ? acc[acc.length - 1].cumDeaths : 0
          // Create cumulative values in addition to the daily values.
          o.cumCases = preCumCases + parseInt(o.cases)
          o.cumDeaths = preCumDeaths + parseInt(o.deaths)
          acc.push(o)
          return acc
        },
        []
      )
    )
    .values()
    .flatten()
    // Remove any US and UK data since we get that from another source.
    .filter(o => (o.geoId !== 'US') | (o.geoId !== 'UK'))
    .map(o => [o.geoId, null, toISODate(o.dateRep), o.cumCases, 0, o.cumDeaths])
    .value()
  return worldRows
}
