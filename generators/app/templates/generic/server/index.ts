const express = require('express')
const compression = require('compression')
const next = require('next')
const path = require('path')
const { parse } = require('url')
const { config } = require('dotenv')

// Get enviroment variables into process.env
config()

const {
  getLangFromPathHelper,
  addLangIfNotInUrl,
  log,
  logError
} = require('./utils')

const api = require('./api')
const prismicApi = require('./prismic')
const sitemap = require('./sitemap')

const dev = process.env.NODE_ENV !== 'production'
const staging = process.env.STAGING

const app = next({ dir: '.', dev })

const PORT = process.env.PORT || 3000

const routesDef = require('./routes')

const redirects = []

// Add routes
const bootstrap = async () => {
  // To preload the Content on server start
  prismicApi.init()

  const handler = routesDef.getRequestHandler(app)

  app.prepare().then(() => {
    // Express app
    const expressApp = express()

    // Compression
    expressApp.use(compression())

    // Static files
    expressApp.get('/sw.js', (req, res) => {
      res.header('Cache-Control', 'no-cache')
      res.sendFile(path.join(__dirname, '..', 'static', 'sw.js'))
    })
    expressApp.get('/manifest.webmanifest', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'static', 'manifest.webmanifest'))
    })
    expressApp.get('/sitemap.xml', (req, res) => {
      res.header('Cache-Control', 'no-cache')
      res.sendFile(path.join(__dirname, '..', 'static', 'sitemap.xml'))
    })
    expressApp.get('/favicon.ico', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'static/favicon/', 'favicon.ico'))
    })
    expressApp.get('/robots.txt', (req, res) =>
      res
        .status(200)
        .sendFile(dev || staging ? 'robots_staging.txt' : 'robots.txt', {
          root: path.join(__dirname, '../static'),
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        })
    )

    redirects.forEach(({ from, to }) => {
      expressApp.get(from, (req, res) => {
        res.redirect(301, to)
      })
    })

    // Api router
    api(expressApp, prismicApi, sitemap, path, dev || staging)

    // Handler for the rest of request that are NOT to the API
    expressApp.get(/^\/(?!api).*/, (req, res) => {
      /**
       * For routing we adjust the path if needed
       */
      if (
        req.url.indexOf('_next') < 0 &&
        req.url.indexOf('static') < 0 &&
        req.url.indexOf('on-demand-entries-ping') < 0
      ) {
        // Fix for trailing slashes issue of Next.js
        // https://github.com/zeit/next.js/issues/1189
        req.url = req.url ? req.url.replace(/\/$/, '') : req.url

        // Add language to the path if needed
        const userLang = getLangFromPathHelper('/', req)
        req.url = addLangIfNotInUrl(req.url, userLang)
      }
      // ---------------

      return handler(req, res, parse(req.url, true))
    })

    // Listen Port
    expressApp.listen(PORT, err => {
      if (err) throw err
      log(`> App running on port ${PORT}`)
    })

    // Sitemap
    sitemap(prismicApi)
  })
}

// Start the whole thing
try {
  bootstrap()
} catch (e) {
  logError(e)
}
