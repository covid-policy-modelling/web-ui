import {useState} from 'react'
import {
  RegionPair,
  SupportedParameter,
  commonModels,
  supportedParameterDesc,
  modelSupports
} from 'lib/models'
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
        {commonModels().length} models
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
  return commonModels().reduce(
    (cnt, [modelSlug, model]) =>
      modelSupports(model, parameterId) ? cnt + 1 : cnt,
    0
  )
}

function getUsedByNames(
  parameterId: SupportedParameter | RegionPair
): JSX.Element[] {
  return commonModels()
    .filter(([modelSlug, model]) => modelSupports(model, parameterId))
    .map(([modelSlug, model]) => (
      <li key={modelSlug}>
        <Check />
        {model.name}
      </li>
    ))
}
