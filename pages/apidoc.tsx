import AppFrame from 'components/AppFrame'
import handleError from 'lib/handle-error'
import {ensureSession} from 'lib/session'
import {ComponentType} from 'react'
import {GetServerSideProps} from 'next'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

function hideTryOutButton(tag: string, operationId: string) {
  // The Try it Out button doesn't actually exist until the operation is expanded,
  // so we have to wait for it to be created
  const operation = document.querySelector(`#operations-${tag}-${operationId}`)
  if (operation) {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (!mutation.addedNodes) return
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i]
          if (
            node instanceof Element &&
            node.classList.contains('opblock-section')
          ) {
            const buttons = node.getElementsByClassName(
              'try-out'
            ) as HTMLCollectionOf<HTMLElement>
            for (let j = 0; j < buttons.length; j++) {
              buttons[j].style.display = 'none'
            }
          }
        }
      })
    })
    observer.observe(operation, {childList: true, subtree: true})
  }
}

const WrapInfoPlugin = function(system: any) {
  return {
    wrapComponents: {
      // eslint-disable-next-line react/display-name
      info: (Original: ComponentType<any>, system: any) => (props: any) => {
        return (
          <div>
            <Original {...props} />
            <div className="info markdown">
              <p>
                You can use this page to explore the API operations available in
                the Covid Modeling application. Expand an operation below, and
                you will be shown the description, parameters and response
                format of the operation. You can also execute the operation by
                selecting <strong>Try it out</strong>, completing the parameters
                and/or request body, then pressing <strong>Execute</strong>.
              </p>
              <p>
                You do not need to authenticate in order to use the operations
                through this page. However, to access the API through any other
                means (curl etc.), you will need to obtain a token by following
                the process below.
              </p>
              <ol style={{listStyle: 'decimal inside'}}>
                <li>
                  Expand the <code>POST /user/token</code> operation below.
                </li>
                <li>
                  Select <strong>Try it out</strong>, followed by{' '}
                  <strong>Execute</strong>.
                </li>
                <li>
                  Scroll down to the <strong>Server response</strong> &gt;{' '}
                  <strong>Details</strong> &gt; <strong>Response body</strong>{' '}
                  section.
                </li>
                <li>
                  Copy the value of the <code>token</code> key, which begins{' '}
                  <code>eyJ...</code>.
                </li>
                <li>
                  Store this token somewhere safe and secure, e.g. using a
                  password manager. Your token cannot be retrieved if it lost,
                  it must instead by regenerated.
                </li>
              </ol>
              <p>
                You must supply this token with any requests you make (other
                that through this interactive documentation). For example:
              </p>
              <pre>
                <code>
                  {`curl -X 'GET' \\\n  'https://\${SERVER}/api/simulations' \\\n  -H 'accept: application/json' \\\n  -H 'Authorization: Bearer \${TOKEN}'`}
                </code>
              </pre>
              <p>
                You <em>may</em> paste this token value into the window that
                appears when you press the <strong>Authorize</strong> button.
                Doing so will include your token in example requests generated
                by the <strong>Try it out</strong> function for other
                operations.
              </p>
              <p>
                Please note that your token will expire after 90 days. You can
                generate a new token at any point, which will then be valid for
                a further 90 days. Tokens can be renewed either through this
                page, or by using the <code>POST /user/token</code> endpoint
                with your existing token. Note that generating a new token will
                immediately invalidate any existing tokens.
              </p>
            </div>
          </div>
        )
      }
    }
  }
}

// Work-around for the fact externalValues are not rendered
// https://github.com/swagger-api/swagger-ui/issues/5433
const examples: Record<string, any> = {}

const ExternalValuePlugin = function(system: any) {
  return {
    wrapComponents: {
      response: (Original: ComponentType<any>, system: any) => (props: any) => {
        const contentType = system.oas3Selectors.responseContentType(
          props.path,
          props.method
        )
        const externalValue = props.response.getIn([
          'content',
          contentType,
          'examples',
          props.activeExamplesKey,
          'externalValue'
        ])
        // Check if externalValue field exists
        if (externalValue) {
          // Check if examples map already contains externalValue key
          if (examples[externalValue]) {
            // Set example value directly from examples map
            const r = props.response.setIn(
              [
                'content',
                contentType,
                'examples',
                props.activeExamplesKey,
                'value'
              ],
              examples[externalValue]
            )
            props = {...props, response: r}
          } else {
            // Download external file
            fetch(externalValue)
              .then(res => res.text())
              .then(data => {
                // Put downloaded file content into the examples map
                examples[externalValue] = data
                // Simulate select another example action
                system.oas3Actions.setActiveExamplesMember({
                  name: 'fake',
                  pathMethod: [props.path, props.method],
                  contextType: 'responses',
                  contextName: props.code
                })
                // Reselect this example
                system.oas3Actions.setActiveExamplesMember({
                  name: props.activeExamplesKey,
                  pathMethod: [props.path, props.method],
                  contextType: 'responses',
                  contextName: props.code
                })
              })
              .catch(e => console.error(e))
          }
        }
        return system.React.createElement(Original, props)
      }
    }
  }
}

interface Props {}

export default function ApiDocPage(props: Props) {
  return (
    <AppFrame loggedIn={true}>
      <SwaggerUI
        url="/api"
        defaultModelExpandDepth={2}
        plugins={[WrapInfoPlugin, ExternalValuePlugin]}
        onComplete={system => {
          // This op doesn't work in the UI because it returns a redirect to a ZIP
          hideTryOutButton('simulations', 'getSimulationDownload')
        }}
      />
    </AppFrame>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = handleError(
  ensureSession(async (ctx, session) => {
    return {
      props: {}
    }
  })
)
