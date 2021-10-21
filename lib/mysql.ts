import fs from 'fs'
import path from 'path'
import mysql, {PoolOptions} from 'mysql2'
import {PoolConnection} from 'mysql2/promise'
import {SQLStatement} from 'sql-template-strings'

// Cert URL: https://www.digicert.com/CACerts/BaltimoreCyberTrustRoot.crt.pem

const host = process.env.DB_HOST
const user = process.env.DB_USERNAME
const password = process.env.DB_PASSWORD
const database = process.env.DB_DATABASE
const config: PoolOptions = {
  host,
  user,
  password,
  database,
  dateStrings: true,
  typeCast: (field, next) => {
    switch (field.type) {
      case 'JSON':
        return JSON.parse(field.string()!)
      default:
        return next()
    }
  }
}

if (process.env.NODE_ENV === 'production') {
  config.ssl = {
    ca: fs
      .readFileSync(
        path.join(process.cwd(), 'lib/BaltimoreCyberTrustRoot.crt.pem')
      )
      .toString()
  }
}

type Callback<P extends Array<unknown>, R> = (...args: P) => Promise<R>

const pool = mysql.createPool(config)

export const withDB = <P extends Array<unknown>, R>(
  cb: (conn: PoolConnection) => Callback<P, R>
): Callback<P, R> => {
  return async (...args: P) => {
    let conn
    let result
    try {
      conn = await pool.promise().getConnection()
      result = await cb(conn)(...args)
    } finally {
      if (conn !== undefined) {
        conn.release()
      }
    }
    return result
  }
}
