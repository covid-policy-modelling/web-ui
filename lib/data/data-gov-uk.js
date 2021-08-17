const {DateTime} = require('luxon')

export const gbDailyCasesURL = `https://api.coronavirus.data.gov.uk/v2/data?areaType=overview&metric=cumCasesBySpecimenDate&metric=cumDeaths28DaysByDeathDate&format=json`
export const gbNationDailyCasesURL = `https://api.coronavirus.data.gov.uk/v2/data?areaType=nation&metric=cumCasesBySpecimenDate&metric=cumDeaths28DaysByDeathDate&format=json`
// Cannot get cases/deaths by NHS Region
export const gbRegionDailyCasesURL = `https://api.coronavirus.data.gov.uk/v2/data?areaType=region&metric=cumCasesBySpecimenDate&metric=cumDeaths28DaysByDeathDate&format=json`

// https://geoportal.statistics.gov.uk/datasets/ons::countries-december-2020-names-and-codes-in-the-united-kingdom/about
const countryMap = Object({
  W92000004: 'GB-WLS',
  S92000003: 'GB-SCT',
  E92000001: 'GB-ENG',
  N92000002: 'GB-NIR'
})

export function parse(gbCasesJSON, gbNationCasesJSON, gbRegionCasesJSON) {
  const gbCaseRecords = parseData(gbCasesJSON, () => null)
  const gbNationCaseRecords = parseData(
    gbNationCasesJSON,
    row => countryMap[row.areaCode]
  )
  const gbRegionCaseRecords = parseData(
    gbRegionCasesJSON,
    row => row.areaCode
  )
  return gbCaseRecords.concat(gbNationCaseRecords).concat(gbRegionCaseRecords)
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
      current.confirmed = row.cumCasesBySpecimenDate || current.confirmed || 0
      // No data about recovered cases
      current.recovered = 0
      current.deaths = row.cumDeaths28DaysByDeathDate || current.deaths || 0

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
