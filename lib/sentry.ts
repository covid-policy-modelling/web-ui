import {NextPageContext} from 'next'

export const initSentry = () => {
  return {
    captureMessage: (
      message: string,
      level?: any,
      extra?: Record<string, any>
    ) => {
      return null
    },

    captureException: (err: Error, errorInfo?: Record<string, any>) => {
      console.error(err)

      return null
    },

    captureContextException: (
      err: NonNullable<NextPageContext['err']>,
      ctx: NextPageContext
    ) => {
      console.error(err)

      return null
    }
  }
}
