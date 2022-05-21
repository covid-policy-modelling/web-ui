import {PropsWithChildren} from 'react'
import styles from './ApplicationComponent.module.css'

type Props = Record<string, never>

export default function ApplicationComponent(props: PropsWithChildren<Props>) {
  return (
    <div className={styles.Content}>
      <div className={styles.Heading}>
        <h3>Continuous application</h3>
        <p>Strategy is enforced for a specific period of time.</p>
      </div>
      {props.children}
    </div>
  )
}
