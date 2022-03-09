const models: ModelMap = require('../models.yml')

try {
  const overrides: ModelMapOverride = require('../.override/models.yml')
  Object.keys(models).forEach(modelId => {
    if (modelId in overrides) {
      Object.assign(models[modelId], overrides[modelId])
    }
  })
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e
  }
  console.log('No .override/models.yml found')
}

Object.keys(models).forEach(modelId => {
  if (!models[modelId].enabled) {
    delete models[modelId]
  }
})

export default models

export type ModelSpec = {
  name: string
  origin: string
  imageURL: string
  metaURLs?: {
    code?: string
    paper?: string
    website?: string
  }
  description: string
  supportedParameters?: SupportedParameter[]
  enabled: boolean

  // A missing supportedRegions field means that it is unknown which regions
  // this model supports.
  // An entry here indicates that the model supports the region as a whole as well as any of the listed subregions.
  supportedRegions?: Record<string, SupportedSubregion[]>
}

type ModelSpecOverride = {
  [Property in keyof ModelSpec]+?: ModelSpec[Property]
}

type SupportedSubregion = string
export type RegionPair = [string, string?]

export type MinimalModelSpec = {
  metaURLs?: {
    code?: string
    paper?: string
    website?: string
  }
}

export type ModelMap = {[key: string]: ModelSpec}
type ModelMapOverride = {[key: string]: ModelSpecOverride}

export enum SupportedParameter {
  ContactReduction = 'contactReduction',
  InterventionStrategies = 'interventionStrategies',
  R0 = 'r0'
}

export function supportedParameterDesc(
  supportedParameter: SupportedParameter | RegionPair
) {
  if (typeof supportedParameter === 'string') {
    switch (supportedParameter) {
      case SupportedParameter.ContactReduction:
        return 'Contact reduction is used by'
      case SupportedParameter.InterventionStrategies:
        return 'Intervention strategies are used by'
      case SupportedParameter.R0:
        return 'Customizable R0 is used by'
      default:
        throw new Error('Missing case')
    }
  }

  return 'Region is supported by'
}

export function modelSupports(
  spec: ModelSpec,
  parameter: SupportedParameter | RegionPair
) {
  if (typeof parameter === 'string') {
    return (
      spec.supportedParameters !== undefined &&
      spec.supportedParameters.includes(parameter)
    )
  }

  const [regionID, subregionID_] = parameter
  let subregionID = subregionID_

  // If it's not documented, we assume the model supports any region
  if (spec.supportedRegions === undefined) {
    return true
  }
  if (!(regionID in spec.supportedRegions)) {
    return false
  }
  const subregions = spec.supportedRegions[regionID]
  if (subregionID == '_self' || subregionID === undefined) {
    if (!subregions || subregions.length == 0) {
      return true
    }
    subregionID = regionID
  }
  if (subregions && subregions.includes(subregionID)) {
    return true
  }
  return false
}
