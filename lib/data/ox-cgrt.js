const d3 = require('d3')

export const gbInterventionsURL = `https://raw.githubusercontent.com/OxCGRT/covid-policy-tracker/master/data/OxCGRT_latest.csv`

function getNationInterventionData(data, nation) {
  //console.log(`${nation}: ${data}`)
  return data.filter(function(d) {
    return d.RegionName == nation
  })
}

function processDateString(dt) {
  return (
    dt.substring(0, 4) + '-' + dt.substring(4, 6) + '-' + dt.substring(6, 8)
  )
}

function makeInterventionObject(
  regionId,
  subregionId,
  policyName,
  startDate,
  endDate
) {
  return {
    regionId: regionId,
    subregionId: subregionId,
    policy: policyName,
    notes: null,
    source: gbInterventionsURL,
    issueDate: null,
    startDate: startDate === null || startDate === undefined ? null : startDate,
    easeDate: null,
    expirationDate: null,
    endDate: endDate === null || endDate === undefined ? null : endDate
  }
}

const interventionMapping = Object({
  SchoolClose: {variable: 'C1_School closing', threshold: 2},
  GathRestrict10: {variable: 'C4_Restrictions on gatherings', threshold: 3},
  StayAtHome: {variable: 'C6_Stay at home requirements', threshold: 2}
})

const countryMapping = Object({
  'GB-WLS': 'Wales',
  'GB-SCT': 'Scotland',
  'GB-ENG': 'England',
  'GB-NIR': 'Northern Ireland'
})

export function parse(gbInterventionsCSV) {
  const subregionIds = Object.keys(countryMapping)
  const interventions = []
  const gbInterventions = d3.csvParse(gbInterventionsCSV)
  for (let s = 0; s < subregionIds.length; s++) {
    const subregionId = subregionIds[s]
    const nation = countryMapping[subregionId]
    const regionId = subregionId.split('-')[0]
    const data = getNationInterventionData(gbInterventions, nation)
    const dt = data.map(function(d) {
      return processDateString(d.Date)
    })
    const policyNames = Object.keys(interventionMapping)
    for (let p = 0; p < policyNames.length; p++) {
      const policyName = policyNames[p]
      const variable = interventionMapping[policyName].variable
      const threshold = interventionMapping[policyName].threshold
      const x = data.map(function(d) {
        return parseFloat(d[variable]) >= threshold
      })
      let start = 0
      let end = 0
      let lastVal = false
      let intervention = {}
      for (let i = 0; i < x.length; i++) {
        if ((x[i] == true) & (lastVal == false)) {
          start = i
        }
        if ((x[i] == false) & (lastVal == true)) {
          end = i
          intervention = makeInterventionObject(
            regionId,
            subregionId,
            policyName,
            dt[start],
            dt[end]
          )
          interventions.push(intervention)
        }
        if ((i == x.length - 1) & (x[i] == true)) {
          intervention = makeInterventionObject(
            regionId,
            subregionId,
            policyName,
            dt[start],
            null
          )
          interventions.push(intervention)
        }
        lastVal = x[i]
      }
    }
  }
  return interventions
}
