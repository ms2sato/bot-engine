'use strict';

function webServer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  function createEndpoints(controller) {
    controller.createWebhookEndpoints(controller.webserver);
  }

  config = config || { createEndpoints: createEndpoints };

  return function (engine) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'webServer';

    engine.events.on('beforeBinding:' + name, function (engine) {
      return new Promise(function (resolve, reject) {
        var controller = engine.controller;
        controller.setupWebserver(process.env.PORT || config.port, function (err, webserver) {
          if (err) {
            return reject(err);
          }
          config.createEndpoints(controller);
          return resolve(webserver);
        });
      });
    });
  };
}
module.exports = webServer;