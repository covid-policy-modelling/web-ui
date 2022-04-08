import Axios from 'axios'
import App, {AppContext} from 'next/app'
import NextError from 'next/error'
import Head from 'next/head'
import 'react-virtualized/styles.css'
import {SWRConfig} from 'swr'
import '../css/app.css'

const scriptPolicy =
  process.env.NODE_ENV === 'production'
    ? // In production builds, only allow JS from within the app.
      "'self'"
    : // In dev builds, allow JS within the app,
      // or the inline scripts bundled by Next.js/webpack in dev mode.
      // Note that Next.js 9.x now requires unsafe-eval to be included for dev.
      "'self' 'unsafe-inline' 'unsafe-eval'"

const contentSecurityPolicy = [
  `default-src 'none'`,
  // Allow JS from within the application and its bundled scripts.
  `script-src ${scriptPolicy}`,
  // Allow stylesheets within the application or hosted by Google.
  // We use inline styles in the React components.
  `style-src 'self' https://fonts.googleapis.com 'unsafe-inline'`,
  // Allow fonts hosted by Google.
  `font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com`,
  // Allow fetch calls to the application's own API.
  `connect-src 'self'`,
  // Allow favicon and other local images.
  `img-src 'self'`,
  // Prevent the site from being included in an iframe.
  `frame-ancestors 'none'`,
  // Allow prefetching resources within the application.
  `prefetch-src 'self'`
].join('; ')

/**
 * The main application frame.
 *
 * @param appProps Props provided by Next.js
 */
export default class WebApp extends App {
  state: {error?: Error & {statusCode?: number}} = {}

  static async getInitialProps(appContext: AppContext) {
    const {ctx} = appContext

    if (ctx.err) {
      console.error(ctx.err)
    }

    if (ctx.res) {
      ctx.res.setHeader('Content-Security-Policy', contentSecurityPolicy)
    }

    const pageProps = await App.getInitialProps(appContext)
    return {pageProps}
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(err: Error, errorInfo: Record<string, any>) {
    console.error(err)
    this.setState({error: err})
  }

  render() {
    const {Component, pageProps} = this.props

    if (this.state.error) {
      return <NextError statusCode={this.state.error?.statusCode ?? 500} />
    }

    return (
      <>
        <Head>
          <title>COVID Modeling</title>
          <meta
            name="Description"
            content={`A tool for understanding the impact of parameter changes on the results of COVID simulation runs`}
          />
          <link rel="icon" type="image/x-icon" href="/images/favicon.png" />
        </Head>

        <SWRConfig
          value={{fetcher: key => Axios.get(key).then(resp => resp.data)}}
        >
          <Component {...pageProps} />
        </SWRConfig>
      </>
    )
  }
}
