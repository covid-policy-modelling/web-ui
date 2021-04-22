const {DateTime} = require('luxon')

export const gbDailyCasesURL = `https://api.coronavirus.data.gov.uk/v2/data?areaType=nation&metric=cumCasesByPublishDate&metric=cumDeathsByPublishDate&format=json`

const countryMap = Object({
  Wales: 'WLS',
  Scotland: 'SCT',
  England: 'ENG',
  'Northern Ireland': 'NIR'
})

export function parse(gbCasesJSON) {
  //-----------------------------------------------------------
  // Parse the UK data - ISO value for the UK is GB so use that (despite the fact that
  // Northern Ireland is not in GB but it is in the UK).
  // Schema: https://github.com/covid-modeling/model-runner/blob/master/packages/api/schema/
  const metricsByGBNation = {}

  const parsed = JSON.parse(gbCasesJSON)
  const gbCaseRecords = parsed.body
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => {
      const regionID = 'GB'
      const subRegion = countryMap[row.areaName]
      const subregionID = `GB-${subRegion}`
      // Date is already a string with the format YYYY-MM-DD
      // but will leave the code below as is
      const dateSQL = DateTime.fromFormat(
        row.date.toString(),
        'yyyy-MM-dd'
      ).toISODate()

      // Fill in null values with the last non-null value or zero
      const current =
        metricsByGBNation[row.areaName] ||
        (metricsByGBNation[row.areaName] = {})
      current.confirmed = row.cumCasesByPublishDate || current.confirmed || 0
      // No data about recovered cases
      current.recovered = 0
      current.deaths = row.cumDeathsByPublishDate || current.deaths || 0

      return [
        regionID,
        subregionID,
        dateSQL,
        current.confirmed,
        current.recovered,
        current.deaths
      ]
    })
  return gbCaseRecords
}
