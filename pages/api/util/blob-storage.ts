import {basename} from 'path'
import {
  BlobServiceClient,
  StorageSharedKeyCredential
} from '@azure/storage-blob'
import {assertEnv} from 'lib/assertions'

const BLOB_STORAGE_ACCOUNT = assertEnv('BLOB_STORAGE_ACCOUNT', true)
const BLOB_STORAGE_KEY = assertEnv('BLOB_STORAGE_KEY', true)
const BLOB_STORAGE_CONTAINER = assertEnv('BLOB_STORAGE_CONTAINER', true)

export function getSharedKeyCredential() {
  return new StorageSharedKeyCredential(BLOB_STORAGE_ACCOUNT, BLOB_STORAGE_KEY)
}

export function getContainerClient() {
  const client = new BlobServiceClient(
    `https://${BLOB_STORAGE_ACCOUNT}.blob.core.windows.net`,
    getSharedKeyCredential()
  )

  return client.getContainerClient(BLOB_STORAGE_CONTAINER)
}

const stubs = {
  // require() cannot take an expression
  'basel-stub.json': require('../../../data/basel-stub.json'),
  'idm-covasim-stub.json': require('../../../data/idm-covasim-stub.json'),
  'mrc-ide-covid-sim-stub.json': require('../../../data/mrc-ide-covid-sim-stub.json'),
  'wss-stub.json': require('../../../data/wss-stub.json')
}

export async function getBlob(path: string): Promise<string | null> {
  if (process.env.LOCAL_MODE) {
    const model = basename(path) as keyof typeof stubs
    return JSON.stringify(stubs[model])
  }

  const blob = getContainerClient().getBlobClient(path)

  try {
    const buffer = await blob.downloadToBuffer()
    return buffer.toString('utf-8')
  } catch (err) {
    if (err.statusCode === 404) {
      return null
    }

    throw err
  }
}
