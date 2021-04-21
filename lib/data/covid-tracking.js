const {DateTime} = require('luxon')

export const covidTrackingURL = `https://api.covidtracking.com/v1/states/daily.json`

export function parse(usaCasesJSON) {
  // Parse the US case data
  const metricsByState = {}
  const usCaseRecords = JSON.parse(usaCasesJSON)
    .sort((a, b) => a.date - b.date)
    .map(row => {
      const regionID = 'US'
      const subregionID = `US-${row.state}`

      // Date is an integer with digits YYYYMMDD
      const dateSQL = DateTime.fromFormat(
        row.date.toString(),
        'yyyyMMdd'
      ).toISODate()

      // Fill in null values with the last non-null value or zero
      const current =
        metricsByState[row.state] || (metricsByState[row.state] = {})
      current.confirmed = row.positive || current.confirmed || 0
      current.recovered = row.recovered || current.recovered || 0
      current.deaths = row.death || current.deaths || 0

      return [
        regionID,
        subregionID,
        dateSQL,
        current.confirmed,
        current.recovered,
        current.deaths
      ]
    })
  return usCaseRecords
}
