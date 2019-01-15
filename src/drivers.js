import { NO_COMMAND } from "./properties"

/**
 * This driver will take a sink of commands, execute the commands, and possibly pass up the result of those commands
 * @returns {commandDriverFactory}
 * @param eventHandler
 * @param commandHandlers
 * @param effectHandlers
 */
export function commandDriverFactory(eventHandler, commandHandlers, effectHandlers) {
  const trigger = function trigger(rawEventName) {
    // DOC : by convention, [rawEventName, rawEventData, ref (optional), ...anything else]
    // DOC : rawEventData is generally the raw event passed by the event handler
    // DOC : `ref` here is :: React.ElementRef and is generally used to pass `ref`s for uncontrolled component
    return function eventHandling(...args) {
      const rawEventStruct = [rawEventName].concat(args);
      return eventHandler.next(rawEventStruct);
    };
  };

  return function commandDriverFactory(sink) {
    sink
      .filter(commands => commands !== NO_COMMAND)
      .map(actions => actions.filter(action => action !== NO_COMMAND))
      .map(commands => {
        commands.forEach(action => {
          const { command, params } = action;

          const commandHandler = commandHandlers[command];
          if (!commandHandler || typeof(commandHandler) !== "function") {
            throw new Error(`Could not find command handler for command ${command}!`);
          }

          commandHandler(trigger, params, effectHandlers);
        });

        return commands;
      })
      .subscribe(() => {})
  }
}
