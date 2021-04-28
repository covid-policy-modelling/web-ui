const d3 = require('d3')

export const usInterventionsURL = `https://raw.githubusercontent.com/COVID19StatePolicy/SocialDistancing/master/data/USstatesCov19distancingpolicy.csv`

export function parse(usInterventionsCSV) {
  // Parse the US intervention data
  const usInterventionRecords = []
  for (const row of d3.csvParse(usInterventionsCSV)) {
    if (row.StatePolicy && row.StatePostal && row.DateEnacted) {
      const regionId = 'US'
      const subregionId = `US-${row.StatePostal}`
      const policy = row.StatePolicy
      const notes = row.PolicyCodingNotes
      const source = row.PolicySource || null
      const issueDate = row.DateIssued || null
      const startDate = row.DateEnacted
      const easeDate = row.DateEased || null
      const expirationDate = row.DateExpiry || null
      const endDate = row.DateEnded || null
      usInterventionRecords.push({
        regionId,
        subregionId,
        policy,
        notes,
        source,
        issueDate,
        startDate,
        easeDate,
        expirationDate,
        endDate
      })
    }
  }
  return usInterventionRecords
}
