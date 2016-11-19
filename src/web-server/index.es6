function webServer (config = {}) {
  function createEndpoints (controller) {
    controller.createWebhookEndpoints(controller.webserver)
  }

  config = config || { createEndpoints }

  return function (engine, name = 'webServer') {
    engine.events.on(`beforeBinding:${name}`, function (engine) {
      return new Promise(function (resolve, reject) {
        const controller = engine.controller
        controller.setupWebserver(process.env.PORT || config.port, (err, webserver) => {
          if (err) {
            return reject(err)
          }
          config.createEndpoints(controller)
          return resolve(webserver)
        })
      })
    })
  }
}
module.exports = webServer
