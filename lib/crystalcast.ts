import {output} from '@covid-policy-modelling/api'
import {Simulation} from './db'
import {elementSum, extractDiff} from './arrayMath'
import models from './models'
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import * as csvjson from 'csvjson'
import {DateTime} from 'luxon'

type KeyOrMetricsAccessor = string | ((m: output.SeverityMetrics) => number[])

type ValueTypeConfiguration = {
  title: string
  required: (keyof output.SeverityMetrics)[]
  values: KeyOrMetricsAccessor
}

const valueTypes: ValueTypeConfiguration[] = [
  {
    title: 'R',
    required: ['R'],
    values: 'R'
  },
  {
    title: 'infection_inc',
    required: ['cumMild', 'cumILI', 'cumSARI', 'cumCritical'],
    values: (metrics: output.SeverityMetrics) =>
      // Calculate the new daily cases from the cumulative cases
      // This is what the UI uses, although I'm not sure it works if the simulation hasn't started at the beginning of the pandemic, as it will make it look like t=0 has a really high increase
      extractDiff(
        elementSum([
          metrics.cumMild,
          metrics.cumILI,
          metrics.cumSARI,
          metrics.cumCritical
        ])
      )
  },
  {
    title: 'hospital_inc',
    required: ['cumSARI', 'cumCritical'],
    values: (metrics: output.SeverityMetrics) =>
      extractDiff(elementSum([metrics.cumSARI, metrics.cumCritical]))
  },
  {
    title: 'icu_inc',
    required: ['cumCritical'],
    values: (metrics: output.SeverityMetrics) =>
      extractDiff(metrics.cumCritical)
  },
  {
    title: 'infection_cum',
    required: ['cumMild', 'cumILI', 'cumSARI', 'cumCritical'],
    values: (metrics: output.SeverityMetrics) =>
      elementSum([
        metrics.cumMild,
        metrics.cumILI,
        metrics.cumSARI,
        metrics.cumCritical
      ])
  },
  {
    title: 'hospital_prev',
    required: ['SARI', 'Critical'],
    values: (metrics: output.SeverityMetrics) =>
      elementSum([metrics.SARI, metrics.Critical])
  },
  {
    title: 'death_inc_line',
    required: ['incDeath'],
    values: 'incDeath'
  }
]

export function exportCsv(
  simulation: Simulation,
  modelSlug: string,
  results: output.ModelOutput
) {
  const creation = DateTime.fromISO(simulation.updated_at)
  const spec = models[modelSlug]
  const startDate = DateTime.fromISO(results.time.t0)
  const metrics = results.aggregate.metrics
  const prepareProjected = (k: KeyOrMetricsAccessor): number[] => {
    // if it's a key name, pluck that metric and datumize
    // if we were handed an accessor, use that to fetch the series to datumize
    switch (typeof k) {
      case 'string':
        return metrics[k as keyof output.SeverityMetrics]!

      case 'function':
        return k(metrics)
    }
  }

  const defined = valueTypes.filter(series =>
    series.required.every(
      acc => metrics[acc] !== undefined && metrics[acc]!.some(v => v != 0)
    )
  )

  const output = defined
    .map(series => {
      const values = prepareProjected(series.values)
      return results.time.timestamps.map((t, i) => {
        const valueDate = startDate.plus({days: t})
        return {
          Group: spec.origin,
          Model: spec.name,
          Scenario: simulation.label,
          ModelType: 'Multiple',
          Version: spec.imageURL.split(':')[1],
          'Creation Day': creation.day,
          'Creation Month': creation.month,
          'Creation Year': creation.year,
          'Day of Value': valueDate.day,
          'Month of Value': valueDate.month,
          'Year of Value': valueDate.year,
          AgeBand: 'All',
          Geography: simulation.region_name,
          ValueType: series.title,
          Value: values[i],
          'Quantile 0_05': '',
          'Quantile 0_1': '',
          'Quantile 0_15': '',
          'Quantile 0_2': '',
          'Quantile 0_25': '',
          'Quantile 0_3': '',
          'Quantile 0_35': '',
          'Quantile 0_4': '',
          'Quantile 0_45': '',
          'Quantile 0_5': '',
          'Quantile 0_55': '',
          'Quantile 0_6': '',
          'Quantile 0_65': '',
          'Quantile 0_7': '',
          'Quantile 0_75': '',
          'Quantile 0_8': '',
          'Quantile 0_85': '',
          'Quantile 0_9': '',
          'Quantile 0_95': ''
        }
      })
    })
    .flat(1)

  let csv = csvjson.toCSV(output, {headers: 'key'})
  csv = csv.replace(/Quantile 0_/g, 'Quantile 0.')
  return csv
}
