import AppFrame from '../components/AppFrame'
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

export default function ApiDocPage() {
  return (
    <AppFrame loggedIn={false}>
      <SwaggerUI
        url="/openapi.json"
        onComplete={system => {
          // This op doesn't work in the UI because it returns a redirect to a ZIP
          hideTryOutButton('simulations', 'getSimulationDownload')
        }}
      />
    </AppFrame>
  )
}
