function baseWebpackServer(webpackConfig, opts) {
  var opn = require('opn')
  var path = require('path')
  var fs = require('fs')
  var express = require('express')
  var webpack = require('webpack')
  var proxyMiddleware = require('http-proxy-middleware')
  // Define HTTP proxies to your custom API backend
  // https://github.com/chimurai/http-proxy-middleware
  var proxyTable = opts.proxy.proxyTable
  var mockTable = opts.mock.mockTable

  // default port where dev server listens for incoming traffic
  var port = process.env.PORT || opts.port || 3000
  // automatically open browser, if not set will be false
  var autoOpenBrowser = !!opts.autoOpenBrowser

  // add hot-reload related code to entry chunks
  Object.keys(webpackConfig.entry).forEach(function (name) {
    webpackConfig.entry[name] = ['webpack-hot-middleware/client?noInfo=true&reload=true'].concat(webpackConfig.entry[name])
  })

  var app = express()
  var compiler = webpack(webpackConfig)

  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache,no-store');
    next();
  });

  var devMiddleware = require('webpack-dev-middleware')(compiler, {
    // publicPath: webpackConfig.output.publicPath,
    quiet: true
  })

  var hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: () => { }
  })
  // force page reload when html-webpack-plugin template changes
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' })
      cb && cb()
    })
  })

  if (process.argv.indexOf('--proxy') > 0) {
    // 使用代理请求远端数据
    Object.keys(proxyTable).forEach(function (context) {
      let pathRewrite = {};
      if (typeof proxyTable[context] !== 'string') {
        pathRewrite = proxyTable[context];
      }
      let obj = {
        changeOrigin: true,
        pathRewrite: pathRewrite
      }
      obj = Object.assign(obj, opts.proxy.config)
      app.use(context, proxyMiddleware(obj))
    })
  } else if (process.argv.indexOf('--mock') > 0) {
    // 使用本地的模拟数据
    Object.keys(mockTable).forEach(function (context) {
      let filename = path.resolve('.' + mockTable[context]);
      app.use(context, function (req, res, next) {
        if (filename.endsWith('.json')) {
          res.json(JSON.parse(fs.readFileSync(filename)));
        } else {
          delete require.cache[filename];
          require(filename)(req, res, next);
        }
      });
    })
  }

  // handle fallback for HTML5 history API
  app.use(require('connect-history-api-fallback')())

  // serve webpack bundle output
  app.use(devMiddleware)

  // enable hot-reload and state-preserving
  // compilation error display
  app.use(hotMiddleware)

  // serve pure static assets
  // var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
  // app.use(staticPath, express.static('./static'))

  var uri = 'http://localhost:' + port

  var _resolve
  var readyPromise = new Promise(resolve => {
    _resolve = resolve
  })

  console.log('> Starting dev server...')
  devMiddleware.waitUntilValid(() => {
    console.log('> Listening at ' + uri + '\n')
    if (autoOpenBrowser) {
      opn(uri)
    }
    _resolve()
  })

  var server = app.listen(port)

  return {
    ready: readyPromise,
    close: () => {
      server.close()
    }
  }
}

module.exports = baseWebpackServer
