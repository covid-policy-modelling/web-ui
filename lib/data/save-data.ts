const fs = require('fs')
const mysql = require('serverless-mysql')
import serverlessMysql from 'serverless-mysql'

const db = mysql({
  maxRetries: 5,
  config: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.NODE_ENV === 'production' && {
      ca: fs.readFileSync(
        require.resolve('../lib/BaltimoreCyberTrustRoot.crt.pem'),
        'utf8'
      )
    },
    dateStrings: true
  }
})

export async function saveCaseData(caseRecords: any[], force: boolean) {
  try {
    console.log('Inserting case data')

    if (!caseRecords.length) {
      throw new Error('No case data found')
    }

    await db.query('START TRANSACTION')

    // Populate the case_data table
    await db.query('CREATE TABLE case_data_import LIKE case_data')
    await db.query(
      `
        INSERT INTO case_data_import
        (region_id, subregion_id, date, confirmed, recovered, deaths)
        VALUES
        ?
      `,
      [caseRecords]
    )

    await validateTableLength(db, 'case_data', 'case_data_import', force)

    console.log(`Saved ${caseRecords.length} records to case_data table...`)
    await db.query(
      'RENAME TABLE case_data TO case_data_old, case_data_import TO case_data'
    )

    await db.query('COMMIT')
  } finally {
    await db.query('DROP TABLE IF EXISTS case_data_old')
    await db.query('DROP TABLE IF EXISTS case_data_import')
  }
}

export async function saveInterventionData(
  allInterventionRecords: any[],
  force: boolean
) {
  try {
    console.log('Inserting interventions data')

    if (!allInterventionRecords.length) {
      throw new Error('No interventions found')
    }

    // INTERVENTIONS DATA
    await db.query('START TRANSACTION')
    // Populate the intervention_data table
    await db.query(
      'CREATE TABLE intervention_data_import LIKE intervention_data'
    )
    await db.query(
      `
        INSERT INTO intervention_data_import
        (
          region_id, subregion_id, policy, notes, source,
          issue_date, start_date, ease_date, expiration_date, end_date
        )
        VALUES
        ?
      `,
      [allInterventionRecords]
    )

    await validateTableLength(
      db,
      'intervention_data',
      'intervention_data_import',
      force
    )

    console.log(
      `Saved ${allInterventionRecords.length} records to interventions table...`
    )
    await db.query(
      'RENAME TABLE intervention_data TO intervention_data_old, intervention_data_import TO intervention_data'
    )

    await db.query('COMMIT')
  } finally {
    await db.query('DROP TABLE IF EXISTS intervention_data_old')
    await db.query('DROP TABLE IF EXISTS intervention_data_import')
  }
}

/**
 * Validates that the new table is not smaller than the old table.
 * The assumption is that our fetch data size will never shrink.
 *
 * @db the database to run the queries on
 * @param origTable The original table to check
 * @param newTable The new table to replace the original table
 * @param ignore If true, ignore this check
 *
 * @throws Error if the new table is smaller than the old table.
 */
async function validateTableLength(
  db: serverlessMysql.ServerlessMysql,
  origTable: string,
  newTable: string,
  ignore: boolean
) {
  if (ignore) {
    return
  }

  const origCount: number = ((await db.query(
    `SELECT count(*) as count from ${origTable}`
  )) as any)[0].count
  const newCount: number = ((await db.query(
    `SELECT count(*) as count from ${newTable}`
  )) as any)[0].count

  if (newCount < origCount) {
    throw new Error(
      `New table ${newTable} has fewer rows than original table ${origTable}. ${newCount} rows and ${origCount} rows respectively`
    )
  }
}
