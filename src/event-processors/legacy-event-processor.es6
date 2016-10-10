class LegacyEventProcessor {
  process (engine, handler) {
    handler.call(engine, engine.controller)
  }
}

module.exports = LegacyEventProcessor
