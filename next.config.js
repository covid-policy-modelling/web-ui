const {DefinePlugin} = require('webpack')

module.exports = {
  env: {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    APP_ENVIRONMENT: process.env.APP_ENVIRONMENT
  },

  webpack: (config, options) => {
    const commit = process.env.NOW_GITHUB_COMMIT_SHA || process.env.GITHUB_SHA
    const release = commit || options.buildId

    config.module.rules.push({
      test: /\.ya?ml$/,
      use: 'js-yaml-loader'
    })

    config = nextSourceMaps(config, options)

    const releaseInfo = {
      release,
      repo: 'covid-modeling/web',
      commit
    }

    console.log('Configuring release:', JSON.stringify(releaseInfo))

    return config
  }
}

function nextSourceMaps(config, options) {
  if (!options.dev) {
    config.devtool = 'source-map'

    for (const plugin of config.plugins) {
      if (plugin.constructor.name === 'UglifyJsPlugin') {
        plugin.options.sourceMap = true
        break
      }
    }

    if (config.optimization && config.optimization.minimizer) {
      for (const plugin of config.optimization.minimizer) {
        if (plugin.constructor.name === 'TerserPlugin') {
          plugin.options.sourceMap = true
          break
        }
      }
    }
  }

  return config
}
