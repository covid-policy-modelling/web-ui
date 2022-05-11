import * as input from '@covid-policy-modelling/api/input-common'
import Joi from '@hapi/joi'
import {useMemo} from 'react'
import {SupportedParameter} from 'lib/models'
import {
  InterventionPeriod,
  StrategyDescriptions,
  StrategyKey
} from 'lib/new-simulation-state'
import Descartes from '../../svg/Descartes.svg'
import SocialDistancingGraphic from '../../svg/SocialDistancingGraphic.svg'
import Trash from '../../svg/Trash.svg'
import Unacast from '../../svg/Unacast.svg'
import Warn from '../../svg/Warn.svg'
import formStyle from 'components/styles/form.module.css'
import DateInput from './DateInput'
import {ErrorList} from './ErrorMessage'
import FormSection from './FormSection'
import InterventionGuidanceLink from './InterventionGuidanceLink'
import styles from './InterventionPeriodSection.module.css'
import {SupportedParameters} from './SupportedParameters'

interface Props {
  period: InterventionPeriod
  isFirst: boolean
  onChange: (config: Partial<InterventionPeriod>) => void
  onChangeIntervention: (update: Pick<InterventionPeriod, StrategyKey>) => void
  remove: () => void
  priorPeriodStartDate: input.ISODate | undefined
  error: Joi.ValidationError | null
  index: number
}

const autoGeneratedPeriodText = `This intervention start date and policy settings were populated
based on the latest known real-world data. You may modify this to run
simulations, or correct this data by editing below.`

function enforceBounds(strNumber: number | string): number | '' {
  const num =
    typeof strNumber === 'number' ? strNumber : parseInt(strNumber, 10)
  return Number.isNaN(num) ? '' : num < 0 ? 0 : num > 100 ? 100 : num
}

// TODO Need to constrain the start date of the period to ensure it fits within the range
export default function InterventionPeriodSection(props: Props) {
  const contactReduction = enforceBounds(
    props.period.reductionPopulationContact
  )
  return (
    <div className={styles.InterventionPeriodSection}>
      <FormSection title={props.isFirst ? 'Initial Policy' : 'Policy Changes'}>
        {!props.isFirst && (
          <button className={styles.RemoveButton} onClick={props.remove}>
            <Trash />
          </button>
        )}
        {props.period.isAutoGenerated && (
          <div className={styles.AutoGenMessage}>
            <Warn />
            <div>{autoGeneratedPeriodText}</div>
          </div>
        )}
        {props.isFirst ? (
          <p>Intervention policies started on</p>
        ) : (
          <p>Starting on</p>
        )}
        <DateInput
          value={props.period.startDate}
          onChange={startDate =>
            props.onChange({
              startDate
            })
          }
        />

        <ErrorList
          error={props.error}
          path={['interventionPeriods', props.index, 'startDate']}
          className="mt-4"
        />

        <h3>
          Intervention strategies{' '}
          <SupportedParameters
            parameterId={SupportedParameter.InterventionStrategies}
          />
        </h3>

        <ul className={styles.StrategyList}>
          {Object.entries(StrategyDescriptions).map(
            ([strategyKey, description]) => (
              <Strategy
                key={strategyKey}
                label={StrategyDescriptions[strategyKey].label}
                enabled={!!props.period[strategyKey as StrategyKey]}
                descriptions={description.intensities}
                intensity={
                  props.period[strategyKey as StrategyKey] ||
                  input.Intensity.Aggressive
                }
                onChange={(enabled: boolean, intensity: input.Intensity) =>
                  props.onChangeIntervention({
                    [strategyKey]: enabled ? intensity : undefined
                  })
                }
              />
            )
          )}
        </ul>

        <h3>
          Contact reduction{' '}
          <SupportedParameters
            parameterId={SupportedParameter.ContactReduction}
          />
        </h3>
        <p>
          Based on the intervention strategies selected above, what is the
          estimated reduction in population contact?
        </p>
        <div className={styles.PercInput}>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className={`${
              formStyle.textInput
            } flex-1 ${typeof contactReduction !== 'number' && formStyle.warn}`}
            placeholder="Enter estimated percent"
            value={contactReduction}
            onChange={e => {
              const reductionPopulationContact = enforceBounds(e.target.value)
              props.onChange({reductionPopulationContact})
            }}
          />
          <div
            className={`${styles.PercSign} ${typeof contactReduction !==
              'number' && styles.warn}`}
          >
            %
          </div>
        </div>

        <ErrorList
          error={props.error}
          path={[
            'interventionPeriods',
            props.index,
            'reductionPopulationContact'
          ]}
          className="mt-4"
        />

        <p>
          <SocialDistancingGraphic className="max-w-full" />
        </p>
        <p className="mb-4" style={{color: '#525560'}}>
          Estimating this reduction is not an exact science. It is recommended
          to familiarize yourself with the latest contact reduction rates from
          the following data sources:
        </p>

        <InterventionGuidanceLink
          logo={<img src="/images/google.png" />}
          href="https://www.google.com/covid19/mobility/"
          text="Google’s COVID-19 Community Mobility Reports"
        />

        <InterventionGuidanceLink
          logo={<Descartes />}
          href="https://www.descarteslabs.com/mobility/"
          text="Descartes Labs - Changes in US Mobility Report"
        />

        <InterventionGuidanceLink
          logo={<Unacast />}
          href="https://www.unacast.com/covid19/social-distancing-scoreboard"
          text="Unacast Social Distancing Scoreboard"
        />
      </FormSection>
    </div>
  )
}

interface StrategyProps {
  enabled: boolean
  label: string
  descriptions?: Record<input.Intensity, string>
  intensity: input.Intensity
  onChange: (enabled: boolean, intensity: input.Intensity) => void
}

function Strategy(props: StrategyProps) {
  const randomID = () =>
    Math.random()
      .toString(36)
      .substring(2, 15)

  const idBase = useMemo(() => `${randomID()}${randomID()}`, [])

  return (
    <li>
      <div className={styles.Strategy}>
        <input
          suppressHydrationWarning
          type="checkbox"
          id={idBase}
          checked={props.enabled}
          onChange={e => props.onChange(e.target.checked, props.intensity)}
        />
        <label suppressHydrationWarning htmlFor={idBase}>
          {props.label}
        </label>
      </div>
      {props.descriptions && props.enabled && (
        <ul className={styles.Intensities}>
          {Object.entries(input.Intensity).map(([label, intensity]) => (
            <li key={intensity} className={styles.Intensity}>
              <input
                type="radio"
                suppressHydrationWarning
                value={intensity}
                id={`${idBase}-${intensity}`}
                checked={props.intensity === intensity}
                onChange={() => props.onChange(true, intensity)}
              />
              <label
                htmlFor={`${idBase}-${intensity}`}
                suppressHydrationWarning
              >
                {label} · {props.descriptions && props.descriptions[intensity]}
              </label>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
