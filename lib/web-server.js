'use strict';

function webServer() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (name, engine) {
    function responseAuth(err, req, res) {
      if (err) {
        res.status(500).send('ERROR: ' + err);
      } else {
        res.send('Success!');
      }
    }

    engine.events.on('beforeBinding:webServer', function (engine) {
      return new Promise(function (resolve, reject) {
        var controller = engine.controller;
        controller.setupWebserver(process.env.PORT || config.port, function (err, webserver) {
          if (err) {
            return reject(err);
          }

          controller.createWebhookEndpoints(controller.webserver);
          controller.createOauthEndpoints(controller.webserver, responseAuth);
          return resolve(webserver);
        });
      });
    });
  };
}

module.exports = webServer;