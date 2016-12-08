var webServer = require('./index')

let responseOauth = function (err, req, res) {
  if (err) {
    res.status(500).send('ERROR: ' + err)
  } else {
    res.send('Success!')
  }
}

function createEndpoints (controller) {
  controller.createWebhookEndpoints(controller.webserver)
  controller.createOauthEndpoints(controller.webserver, responseOauth)
}

module.exports = function (config) {
  if (!config) {
    return webServer({ createEndpoints })
  }

  if (!config.createEndpoints) {
    responseOauth = config.responseOauth || responseOauth
    config.createEndpoints = createEndpoints
  }
  return webServer(config)
}
