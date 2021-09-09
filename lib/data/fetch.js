const fs = require('fs')
const path = require('path')
const https = require('https')
const URL = require('url')
const filenamifyUrl = require('filenamify-url')

const usParser = require('./covid-tracking')
const dataGovUKParser = require('./data-gov-uk')
const ecdcParser = require('./ecdc')
const oxCGRTParser = require('./ox-cgrt')
const statePolicyParser = require('./state-policy')
const oxCGRTTimeseriesParser = require('./ox-cgrt-timeseries')
const save = require('./save-data')

export async function fetchData(db, cacheDir, force, dryRun) {
  if (cacheDir) {
    console.log(`Using cache directory '${cacheDir}'`)
  }

  if (force) {
    console.warn(
      'Forcing results to be saved to database even if there are validation errors'
    )
  }

  // Fetch the raw data
  const [
    usaCasesJSON,
    ecdcCasesJSON,
    gbCasesJSON,
    gbNationCasesJSON,
    gbInterventionsCSV,
    usInterventionsCSV,
    internationalSchoolClosuresCSV,
    internationalRestrictionsOnGatheringsCSV,
    internationalStayAtHomeRequirementsCSV
  ] = await Promise.all([
    fetchCached(usParser.covidTrackingURL, cacheDir),
    fetchCached(ecdcParser.ecdcCasesURL, cacheDir),
    fetchCached(dataGovUKParser.gbDailyCasesURL, cacheDir),
    fetchCached(dataGovUKParser.gbNationDailyCasesURL, cacheDir),
    fetchCached(oxCGRTParser.gbInterventionsURL, cacheDir),
    fetchCached(statePolicyParser.usInterventionsURL, cacheDir),
    fetchCached(
      oxCGRTTimeseriesParser.internationalSchoolClosuresURL,
      cacheDir
    ),
    fetchCached(
      oxCGRTTimeseriesParser.internationalRestrictionsOnGatheringsURL,
      cacheDir
    ),
    fetchCached(
      oxCGRTTimeseriesParser.internationalStayAtHomeRequirementsURL,
      cacheDir
    )
  ])

  const usCaseRecords = usParser.parse(usaCasesJSON)
  const worldRows = ecdcParser.parse(ecdcCasesJSON)
  const gbCaseRecords = dataGovUKParser.parse(gbCasesJSON, gbNationCasesJSON)

  const gbInterventionRecords = oxCGRTParser.parse(gbInterventionsCSV)

  const usInterventionRecords = statePolicyParser.parse(usInterventionsCSV)
  const worldInterventionRecords = oxCGRTTimeseriesParser.parse(
    internationalSchoolClosuresCSV,
    internationalRestrictionsOnGatheringsCSV,
    internationalStayAtHomeRequirementsCSV
  )

  const caseRecords = worldRows.concat(usCaseRecords).concat(gbCaseRecords)

  const allInterventionRecords = usInterventionRecords
    .concat(worldInterventionRecords)
    .concat(gbInterventionRecords)
    .filter(row => !!row.startDate)
    .map(row => [
      row.regionId,
      row.subregionId,
      row.policy,
      row.notes,
      row.source,
      row.issueDate,
      row.startDate,
      row.easeDate,
      row.expirationDate,
      row.endDate
    ])

  if (cacheDir) {
    fs.writeFileSync(
      path.join(cacheDir, 'case-data.json'),
      JSON.stringify(caseRecords, null, 2),
      'utf8'
    )

    fs.writeFileSync(
      path.join(cacheDir, 'intervention-data.json'),
      JSON.stringify(allInterventionRecords, null, 2),
      'utf8'
    )
  }

  if (dryRun) {
    console.warn('Skipping storage of results')
    return
  }

  let isError = false
  try {
    await save.saveCaseData(db, caseRecords, force)
  } catch (e) {
    console.error('Failed to insert case data')
    console.error(e)
    isError = true
  }

  try {
    await save.saveInterventionData(db, allInterventionRecords, force)
  } catch (e) {
    console.error('Failed to insert intervention data')
    console.error(e)
    isError = true
  }

  if (isError) {
    console.error('Failed to complete all tasks')
  }
  return isError
}

async function fetchCached(url, cacheDir) {
  const cacheFilename = filenamifyUrl(url)

  const cachePath = cacheDir && path.join(cacheDir, cacheFilename)

  if (cachePath && fs.existsSync(cachePath)) {
    console.log(`Using existing download ${cachePath}...`)
    return fs.readFileSync(cachePath, 'utf8')
  } else {
    console.log(`Downloading from ${url}...`)
    let result = ''
    await new Promise((resolve, reject) => {
      fetch(url)
      function fetch(url) {
        https.get(url, res => {
          // Follow path redirects
          if (res.statusCode === 301 || res.statusCode === 302) {
            const oldURL = URL.parse(url)
            const locationURL = URL.parse(res.headers.location)
            oldURL.path = locationURL.path
            oldURL.pathname = locationURL.pathname
            oldURL.href = null
            const redirectURL = URL.format(oldURL)
            console.log(`Redirected\n  from ${url}\n  to ${redirectURL}...`)
            fetch(redirectURL)
          } else {
            res.on('data', chunk => (result += chunk))
            res.on('end', resolve)
            res.on('error', reject)
          }
        })
      }
    })

    if (cacheDir) {
      if (!fs.existsSync(cacheDir)) {
        console.log(`Cache directory ${cacheDir} does not exist. Creating ...`)
        fs.mkdirSync(cacheDir)
      }
    }

    if (cachePath) {
      console.log(`Saving download to ${cachePath}...`)
      fs.writeFileSync(cachePath, result, 'utf8')
    }
    return result
  }
}
