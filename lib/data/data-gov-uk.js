const {DateTime} = require('luxon')

export const gbDailyCasesURL = `https://api.coronavirus.data.gov.uk/v2/data?areaType=overview&metric=cumCasesByPublishDate&metric=cumDeaths28DaysByPublishDate&format=json`
export const gbNationDailyCasesURL = `https://api.coronavirus.data.gov.uk/v2/data?areaType=nation&metric=cumCasesByPublishDate&metric=cumDeaths28DaysByPublishDate&format=json`

const countryMap = Object({
  W92000004: 'GB-WLS',
  S92000003: 'GB-SCT',
  E92000001: 'GB-ENG',
  N92000002: 'GB-NIR'
})

export function parse(gbCasesJSON, gbNationCasesJSON) {
  const gbCaseRecords = parseData(gbCasesJSON, () => null)
  const gbNationCaseRecords = parseData(
    gbNationCasesJSON,
    row => countryMap[row.areaCode]
  )
  return gbCaseRecords.concat(gbNationCaseRecords)
}

function parseData(gbNationCasesJSON, extractSubregionID) {
  const metricsBySubregion = {}

  const parsed = JSON.parse(gbNationCasesJSON)
  const gbCaseRecords = parsed.body
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(row => {
      const regionID = 'GB'
      const subregionID = extractSubregionID(row)
      // Date is already a string with the format YYYY-MM-DD
      // but will leave the code below as is
      const dateSQL = DateTime.fromFormat(
        row.date.toString(),
        'yyyy-MM-dd'
      ).toISODate()

      // Fill in null values with the last non-null value or zero
      const current =
        metricsBySubregion[subregionID] ||
        (metricsBySubregion[subregionID] = {})
      current.confirmed = row.cumCasesByPublishDate || current.confirmed || 0
      // No data about recovered cases
      current.recovered = 0
      current.deaths = row.cumDeaths28DaysByPublishDate || current.deaths || 0

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
