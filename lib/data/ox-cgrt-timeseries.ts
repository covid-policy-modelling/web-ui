// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import * as csvjson from 'csvjson'
import * as iso from 'i18n-iso-countries'
import {input} from '@covid-modeling/api'
import {DateTime} from 'luxon'

export const internationalSchoolClosuresURL = `https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/timeseries/c1_school_closing.csv`
export const internationalRestrictionsOnGatheringsURL = `https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/timeseries/c4_restrictions_on_gatherings.csv`
export const internationalStayAtHomeRequirementsURL = `https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/timeseries/c6_stay_at_home_requirements.csv`

interface PolicyRow {
  regionId: string
  subregionId: string | null
  policy: string | null
  notes: string | null
  source: string | null
  issueDate: input.ISODate | null
  startDate: input.ISODate | null
  easeDate: input.ISODate | null
  expirationDate: input.ISODate | null
  endDate: input.ISODate | null
}

const dateFormat = 'ddMMMyyyy'

export function parse(
  internationalSchoolClosuresCSV: string,
  internationalRestrictionsOnGatheringsCSV: string,
  internationalStayAtHomeRequirementsCSV: string
): PolicyRow[] {
  const internationalSchoolClosures = parseCsv(
    internationalSchoolClosuresCSV,
    'SchoolClose',
    2
  )
  const internationalRestrictionsOnGatherings = parseCsv(
    internationalRestrictionsOnGatheringsCSV,
    'GathRestrict10',
    3
  )
  const internationalStayAtHomeRequirements = parseCsv(
    internationalStayAtHomeRequirementsCSV,
    'StayAtHome',
    2
  )
  const worldInterventionRecords = internationalSchoolClosures
    .concat(internationalRestrictionsOnGatherings)
    .concat(internationalStayAtHomeRequirements)
  return worldInterventionRecords
}

export function parseCsv(
  csv: string,
  policyName: string,
  threshold: number
): PolicyRow[] {
  const arr = csvjson.toObject(csv) as []

  // each array element is a country
  // find the earliest date where the threshold is reached and that is the start
  // continue to find any date where it ends and that is the end
  return arr
    .map((countryRow: Record<string, string>) => {
      const isoCode = getIsoCode(countryRow[''])

      // note that dates are pre-sorted
      const startIndex = Object.values(countryRow).findIndex(
        level =>
          Number.isFinite(Number.parseInt(level)) &&
          Number.parseInt(level) >= threshold
      )
      const startDate = Object.keys(countryRow)[startIndex]

      const endIndex = Object.values(countryRow).findIndex(
        (level, i) =>
          i >= startIndex &&
          Number.isFinite(Number.parseInt(level)) &&
          Number.parseInt(level) < threshold
      )
      const endDate = Object.keys(countryRow)[endIndex]

      return {
        regionId: isoCode,
        subregionId: null,
        policy: policyName,
        notes: null,
        source: null,
        issueDate: null,
        startDate:
          startDate === null || startDate === undefined
            ? null
            : DateTime.fromFormat(startDate, dateFormat).toISODate(),
        easeDate: null,
        expirationDate: null,
        endDate:
          endDate === null || endDate === undefined
            ? null
            : DateTime.fromFormat(endDate, dateFormat).toISODate()
      }
    })
    .filter(row => row.regionId)
}

function getIsoCode(alpha3: string): string {
  const isoCode = iso.alpha3ToAlpha2(alpha3)
  if (isoCode) {
    return isoCode
  }
  if (alpha3 === 'RKS') {
    // special case for Kosovo. Its ISO code is not official yet
    // see: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#cite_ref-26
    return 'XK'
  }
  return ''
}
