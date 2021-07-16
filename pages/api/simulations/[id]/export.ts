import {output} from '@covid-policy-modelling/api'
import {getSimulation} from '../../../../lib/db'
import {withDB} from '../../../../lib/mysql'
import {exportCsv} from '../../../../lib/crystalcast'
import {getBlob} from '../../util/blob-storage'
import dispatch from '../../util/dispatch'
import requireSession from '../../util/require-session'

export default dispatch(
  'GET',
  withDB(conn =>
    requireSession(ssn => async (req, res) => {
      const sim = await getSimulation(conn, ssn.user, {
        id: parseInt(req.query.id as string)
      })

      if (!sim) {
        res.status(404).json({error: 'Not found'})
        return
      }

      const modelRun = sim.model_runs.find(
        run =>
          run.model_slug.toLowerCase() ===
          (req.query.model as string).toLowerCase()
      )

      if (!modelRun || !modelRun.results_data) {
        res.status(404).json({error: 'Not found'})
        return
      }

      const resultsData = await getBlob(modelRun.results_data)
      const modelOutput = JSON.parse(resultsData!) as output.ModelOutput

      const csv = exportCsv(sim, modelRun.model_slug, modelOutput)
      res.setHeader('Content-Type', 'text/csv')
      res.status(200).send(csv)
    })
  )
)
