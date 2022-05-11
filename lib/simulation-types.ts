import {RunStatus} from '@covid-policy-modelling/api'
import {ModelInput} from '@covid-policy-modelling/api/input'
import {
  CommonModelInput,
  ISODate,
  InterventionPeriod,
  Region,
  Subregion
} from '@covid-policy-modelling/api/input-common'
import {ModelDescription} from '@covid-policy-modelling/api/output'

export {RunStatus}

export const ParameterAbbreviations: Record<string, string> = {
  caseIsolation: 'CI',
  schoolClosure: 'SC',
  socialDistancing: 'SD',
  voluntaryHomeQuarantine: 'VHQ'
}

export const InterventionNames = {
  schoolClosure: 'School Closures',
  socialDistancing: 'Social Distancing (Everyone)',
  caseIsolation: 'Case Isolation',
  voluntaryHomeQuarantine: 'Voluntary Home Quarantine'
}

export type InterventionName = keyof typeof InterventionNames

/**
 * This is one intervention entry for one state in our interventions data
 */
export interface InterventionData {
  dateIssued: ISODate
  dateEnacted: ISODate
  dateExpiry: ISODate
  dateEnded: ISODate
  notes: string
  source: string
}

/**
 * This is intervention data for an entire state
 */
export interface Interventions {
  // The two interventions that we use right now are SchoolClose and StayAtHome
  SchoolClose?: InterventionData
  StayAtHome?: InterventionData
  [key: string]: InterventionData | undefined
}

/**
 * This is all of our interventions data
 */
export interface InterventionMap {
  [key: string]: Record<string, Interventions>
}

export type ModelRun = {
  model_slug: string
  status: RunStatus
  results_data: string | null
  export_location: string | null
}

export type Simulation = {
  id: number
  region_name: string
  status: RunStatus
  subregion_name: string | undefined
  region_id: string | undefined
  subregion_id: string | undefined
  github_user_id: number
  github_user_login: string
  configuration: ModelInput
  model_runs: ModelRun[]
  label: string | undefined
  created_at: string
  updated_at: string
}

export type CommonSimulation = Simulation & {
  region_id: string
  configuration: CommonModelInput
  label: string
}

export type SimulationSummary = Omit<CommonSimulation, 'configuration'> & {
  configurationSummary: string
}

type ModelCaseSummary = {
  cConf: number
  cHosp: number
  cDeaths: number
  peakDeath: ISODate
  peakDailyDeath: number
  modelVersion?: string
}

export type CaseSummary = Record<string, ModelCaseSummary>

/**
 * The data sent from web UI to backend
 */
export interface NewSimulationConfig {
  regionID: Region
  subregionID?: Subregion
  label: string
  /**
   * @examples [1]
   */
  r0: number | undefined
  customCalibrationDate?: ISODate
  interventionPeriods: InterventionPeriod[]
}

export interface NewModelRunConfig {
  /**
   * @examples ["mrc-ide-covid-sim"]
   */
  model_slug: string
  config: ModelInput
}

export enum ExportFormat {
  Results = 'results',
  CrystalCast = 'crystalcast'
}
