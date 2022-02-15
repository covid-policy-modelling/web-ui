import {input, output, RunStatus} from '@covid-policy-modelling/api'

export enum SimulationStatus {
  Complete = 'complete',
  InProgress = 'in-progress',
  Failed = 'failed',
  Pending = 'pending',
  Unsupported = 'unsupported'
}

type ISODate = string

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
  region_id: string
  subregion_id: string | undefined
  github_user_id: number
  github_user_login: string
  configuration: input.ModelInput
  model_runs: ModelRun[]
  label: string
  created_at: string
  updated_at: string
}

export type SimulationSummary = Omit<Simulation, 'configuration'> & {
  status: RunStatus
  configurationSummary: string
}

type ModelCaseSummary = {
  cConf: number
  cHosp: number
  cDeaths: number
  peakDeath: input.ISODate
  peakDailyDeath: number
  modelVersion?: string
}

export type CaseSummary = Record<string, ModelCaseSummary>

/**
 * The data sent from web UI to backend
 */
export interface NewSimulationConfig {
  regionID: string
  subregionID?: string
  label: string
  r0: number | undefined
  customCalibrationDate?: ISODate
  interventionPeriods: input.InterventionPeriod[]
}
