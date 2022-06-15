import clone from 'clone'
import {OpenAPIV3} from 'openapi-types'
import models, {ModelSpec} from 'lib/models'
import dispatch from 'pages/api/util/dispatch'
import {expandDocsFor as model_runs} from 'pages/api/simulations/model-runs/[model]/index'
import {expandDocsFor as model_run_export} from 'pages/api/simulations/[id]/model-runs/[model]/export'

const docs = require('../../public/openapi.json') as OpenAPIV3.Document

type Formatter = (pathItem: OpenAPIV3.PathItemObject, model: ModelSpec) => void

const formatters: Record<string, Formatter> = {
  '/simulations/model_runs/{model}': model_runs,
  '/simulations/{id}/model_runs/{model}/export': model_run_export
}

export default dispatch('GET', async (req, res) => {
  docs.info.version = process.env.APP_VERSION!

  const modelSlugs = Object.keys(models)
  modelSlugs.sort()

  const modelSlugSchem = docs.components!.schemas![
    'ModelSlug'
  ]! as OpenAPIV3.SchemaObject
  modelSlugSchem.enum = modelSlugs

  const modelTags = modelSlugs.map(modelSlug => {
    const model = models[modelSlug]
    return {name: model.name, description: model.description}
  })
  docs.tags!.splice(1, 0, ...modelTags)

  Object.keys(docs.paths).forEach(path => {
    if (path.includes('{model}')) {
      modelSlugs.forEach(modelId => {
        const pathItem = clone(docs.paths[path])!
        const formatter = formatters[path]
        if (formatter) {
          formatter(pathItem, models[modelId])
        }
        Object.keys(pathItem).forEach(op => {
          const operation = pathItem[op as OpenAPIV3.HttpMethods]!
          operation.parameters = operation.parameters!.filter(
            p => (p as OpenAPIV3.ParameterObject).name !== 'model'
          )
          operation.operationId = operation.operationId + '-' + modelId
          operation.tags = [models[modelId].name]
        })
        docs.paths[path.replace('{model}', modelId)] = pathItem
      })
    }
  })
  res.json(docs)
})
