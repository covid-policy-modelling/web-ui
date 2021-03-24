import {GetServerSideProps} from 'next'

let didAttachHandlers = false
export function catchUnhandledErrors() {
  if (didAttachHandlers) return
  didAttachHandlers = true

  process.on('unhandledRejection', err => {
    console.error(err as Error)
  })

  process.on('uncaughtException', err => {
    console.error(err)
  })
}

export default function handleError<P>(
  cb: GetServerSideProps<P>
): GetServerSideProps<P> {
  return async ctx => {
    try {
      const result = await cb(ctx)
      return result
    } catch (err) {
      console.error(err)
      throw err
    }
  }
}
