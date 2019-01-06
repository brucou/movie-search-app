! redo the app with react-state-driven and state-transducer
  - exactly same as implementation
  - test that and find the concurrency bugs
- then app with full and correct specs (no design bugs)
  - NO, not necessary
- when finished, update state transducer to remove the event handler library of options! cf code 
TODOs
  - actually might even have meta data in observe and subject interface (give it a name for 
  tracing?)
  - if no eventHandler passed, then use internal event handling library which is just 
  eventEmitter and listeners. Then leave transducers out
  - make preprocessor an object :
    - {rawEvent : (rawEventData, ref) => ...}
  - if not a function then use the object format
- put in the article
  - To improve is to change; to be perfect is to change often. — Churchill
