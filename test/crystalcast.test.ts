import {RunStatus} from '@covid-policy-modelling/api'
import {Simulation} from '../lib/simulation-types'
import {exportCsv} from '../lib/crystalcast'

const simulation: Simulation = {
  id: 0,
  region_name: 'United Kingdom',
  status: RunStatus.Complete,
  subregion_name: undefined,
  region_id: 'GB',
  subregion_id: undefined,
  github_user_id: 1,
  github_user_login: 'covid-policy-modelling-bot',
  configuration: {
    region: 'GB',
    parameters: {
      calibrationDate: '2020-01-02T00:00:00',
      calibrationCaseCount: 0,
      calibrationDeathCount: 0,
      r0: null,
      interventionPeriods: []
    }
  },
  model_runs: [
    {
      model_slug: 'wss',
      status: RunStatus.Complete,
      results_data: '',
      export_location: ''
    },
    {
      model_slug: 'basel',
      status: RunStatus.Complete,
      results_data: '',
      export_location: ''
    }
  ],
  label: 'Test run',
  created_at: '2020-01-03T00:00:00',
  updated_at: '2020-01-04T00:00:00'
}

function loadData(model: string, sliceFrom: number, sliceTo: number) {
  const data = require(`../data/${model}-stub.json`)
  data.time.timestamps = data.time.timestamps.slice(sliceFrom, sliceTo)
  for (const k in data.aggregate.metrics) {
    data.aggregate.metrics[k] = data.aggregate.metrics[k]?.slice(
      sliceFrom,
      sliceTo
    )
  }
  return data
}

describe('crystalcast-exporter', () => {
  it('should produce csv', () => {
    let data = loadData('wss', 100, 104)
    let expected = `Group,Model,Scenario,ModelType,Version,Creation Day,Creation Month,Creation Year,Day of Value,Month of Value,Year of Value,AgeBand,Geography,ValueType,Value,Quantile 0.05,Quantile 0.1,Quantile 0.15,Quantile 0.2,Quantile 0.25,Quantile 0.3,Quantile 0.35,Quantile 0.4,Quantile 0.45,Quantile 0.5,Quantile 0.55,Quantile 0.6,Quantile 0.65,Quantile 0.7,Quantile 0.75,Quantile 0.8,Quantile 0.85,Quantile 0.9,Quantile 0.95
University of Edinburgh / University of Cambridge,WSS,Test run,Multiple,,4,1,2020,2,11,2020,All,United Kingdom,R,3.0256,,,,,,,,,,,,,,,,,,,
University of Edinburgh / University of Cambridge,WSS,Test run,Multiple,,4,1,2020,3,11,2020,All,United Kingdom,R,0.1641,,,,,,,,,,,,,,,,,,,
University of Edinburgh / University of Cambridge,WSS,Test run,Multiple,,4,1,2020,4,11,2020,All,United Kingdom,R,0.8464,,,,,,,,,,,,,,,,,,,
University of Edinburgh / University of Cambridge,WSS,Test run,Multiple,,4,1,2020,5,11,2020,All,United Kingdom,R,1.5359,,,,,,,,,,,,,,,,,,,`
    expect(expected).toEqual(exportCsv(simulation, 'wss', data))

    data = loadData('basel', 100, 104)
    expected = `Group,Model,Scenario,ModelType,Version,Creation Day,Creation Month,Creation Year,Day of Value,Month of Value,Year of Value,AgeBand,Geography,ValueType,Value,Quantile 0.05,Quantile 0.1,Quantile 0.15,Quantile 0.2,Quantile 0.25,Quantile 0.3,Quantile 0.35,Quantile 0.4,Quantile 0.45,Quantile 0.5,Quantile 0.55,Quantile 0.6,Quantile 0.65,Quantile 0.7,Quantile 0.75,Quantile 0.8,Quantile 0.85,Quantile 0.9,Quantile 0.95
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,10,4,2020,All,United Kingdom,infection_inc,82581,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,11,4,2020,All,United Kingdom,infection_inc,5890,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,12,4,2020,All,United Kingdom,infection_inc,2830,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,13,4,2020,All,United Kingdom,infection_inc,17198,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,10,4,2020,All,United Kingdom,hospital_inc,1915,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,11,4,2020,All,United Kingdom,hospital_inc,193,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,12,4,2020,All,United Kingdom,hospital_inc,123,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,13,4,2020,All,United Kingdom,hospital_inc,498,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,10,4,2020,All,United Kingdom,icu_inc,333,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,11,4,2020,All,United Kingdom,icu_inc,32,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,12,4,2020,All,United Kingdom,icu_inc,28,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,13,4,2020,All,United Kingdom,icu_inc,99,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,10,4,2020,All,United Kingdom,infection_cum,82581,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,11,4,2020,All,United Kingdom,infection_cum,88471,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,12,4,2020,All,United Kingdom,infection_cum,91301,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,13,4,2020,All,United Kingdom,infection_cum,108499,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,10,4,2020,All,United Kingdom,hospital_prev,864,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,11,4,2020,All,United Kingdom,hospital_prev,940,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,12,4,2020,All,United Kingdom,hospital_prev,978,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,13,4,2020,All,United Kingdom,hospital_prev,1152,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,10,4,2020,All,United Kingdom,death_inc_line,34,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,11,4,2020,All,United Kingdom,death_inc_line,34,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,12,4,2020,All,United Kingdom,death_inc_line,42,,,,,,,,,,,,,,,,,,,
Neher Lab - Biozentrum Basel,Covid19-Scenarios (Neher),Test run,Multiple,9.8.7,4,1,2020,13,4,2020,All,United Kingdom,death_inc_line,52,,,,,,,,,,,,,,,,,,,`
    expect(expected).toEqual(exportCsv(simulation, 'basel', data))
  })
})
