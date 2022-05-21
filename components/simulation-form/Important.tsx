import {PropsWithChildren} from 'react'
import styles from './Important.module.css'

type Props = Record<string, never>

export default function Important(
  props: PropsWithChildren<Props>
): JSX.Element {
  return <p className={styles.Important}>{props.children}</p>
}
