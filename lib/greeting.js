'use strict';

function greeting() {
  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (engine) {
    var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'greeting';

    function greet(convo) {
      convo.say('I am a bot that has just joined your team');
      convo.say('You must now /invite me to a channel so that I can be of use!');
    }

    engine.events.on('afterCreate:' + name, function (engine, bot) {
      return new Promise(function (resolve, reject) {
        bot.startPrivateConversation({ user: config.createdBy }, function (err, convo) {
          if (err) {
            return reject(err);
          }

          greet(convo);
          resolve();
        });
      });
    });
  };
}

module.exports = greeting;