const _ = require('lodash')
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

// https://geoportal.statistics.gov.uk/datasets/ons::regions-december-2020-names-and-codes-in-england/about
// https://geoportal.statistics.gov.uk/datasets/ons::nhs-england-region-april-2020-names-and-codes-in-england/about
const nhsRegionMap = Object({
  E12000001: 'E40000009',
  E12000002: 'E40000010',
  E12000003: 'E40000009',
  E12000004: 'E40000008',
  E12000005: 'E40000008',
  E12000006: 'E40000007',
  E12000007: 'E40000003',
  E12000008: 'E40000005',
  E12000009: 'E40000006'
})

export function parse(gbCasesJSON, gbNationCasesJSON, gbRegionCasesJSON) {
  const gbCaseRecords = parseData(gbCasesJSON, () => null)
  const gbNationCaseRecords = parseData(
    gbNationCasesJSON,
    row => countryMap[row.areaCode]
  )
  const gbRegionCaseRecords = parseData(gbRegionCasesJSON, row => row.areaCode)
  const gbNHSRegionCaseRecords = parseNHSRegionData(gbRegionCaseRecords)
  return gbCaseRecords
    .concat(gbNationCaseRecords)
    .concat(gbRegionCaseRecords)
    .concat(gbNHSRegionCaseRecords)
}

function parseData(casesJSON, extractSubregionID) {
  const metricsBySubregion = {}

  const parsed = JSON.parse(casesJSON)
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

function parseNHSRegionData(gbRegionCaseRecords) {
  return _.chain(gbRegionCaseRecords)
    .groupBy(record => [record[0], nhsRegionMap[record[1]], record[2]])
    .map(records =>
      _.reduce(
        records,
        (acc, r) => [
          r[0],
          nhsRegionMap[r[1]],
          r[2],
          acc[3] + r[3],
          acc[4] + r[4],
          acc[5] + r[5]
        ],
        ['', '', '', 0, 0, 0]
      )
    )
    .value()
}
