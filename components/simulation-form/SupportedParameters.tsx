import {useState} from 'react'
import models, {
  RegionPair,
  SupportedParameter,
  supportedParameterDesc,
  modelSupports
} from '../../lib/models'
import Check from '../../svg/Check.svg'
import Info from '../../svg/Info.svg'
import styles from './SupportedParameters.module.css'

interface Props {
  parameterId: SupportedParameter | RegionPair
}

export function SupportedParameters(props: Props) {
  const [show, setShow] = useState(false)
  const [stickyShow, setStickyShow] = useState(false)

  return (
    <div className={styles.SupportedParameters}>
      <button
        type="button"
        className={styles.UsedByButton}
        onClick={() => setStickyShow(!stickyShow)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <Info /> Used by {getUsedByCount(props.parameterId)} of{' '}
        {Object.keys(models).length} models
        <div
          className={`${styles.PopUp} ${
            show || stickyShow ? '' : styles.Hidden
          }`}
        >
          <h4>{supportedParameterDesc(props.parameterId)}</h4>
          <ul>{getUsedByNames(props.parameterId)}</ul>
        </div>
      </button>
    </div>
  )
}

function getUsedByCount(parameterId: SupportedParameter | RegionPair) {
  return Object.values(models).reduce(
    (cnt, model) => (modelSupports(model, parameterId) ? cnt + 1 : cnt),
    0
  )
}

function getUsedByNames(
  parameterId: SupportedParameter | RegionPair
): JSX.Element[] {
  return Object.values(models)
    .filter(model => modelSupports(model, parameterId))
    .map(model => (
      <li key={model.name}>
        <Check />
        {model.name}
      </li>
    ))
}
