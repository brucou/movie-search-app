// cf. https://frontarm.com/demoboard/?id=3178de8d-fe66-49de-92ba-e7063725a732
// cf.
import React from 'react';
import ReactDOM from 'react-dom';
import './uikit.css';
import './index.css';
import h from "react-hyperscript";
import { Machine, } from "react-state-driven"
import { create_state_machine } from "state-transducer"
import { applyPatch } from "json-patch-es6";
import { movieSearchFsmDef } from "./fsm"

const fsm = create_state_machine(movieSearchFsmDef, { updateState: applyJSONpatch });

ReactDOM.render(
  h(Machine, {
    eventHandler: movieSearchFsmDef.eventHandler,
    preprocessor: movieSearchFsmDef.preprocessor,
    fsm: fsm,
    commandHandlers: movieSearchFsmDef.commandHandlers,
    effectHandlers: movieSearchFsmDef.effectHandlers,
  }, []),
  document.getElementById('root')
);

/**
 *
 * @param {ExtendedState} extendedState
 * @param {Operation[]} extendedStateUpdateOperations
 * @returns {ExtendedState}
 */
export function applyJSONpatch(extendedState, extendedStateUpdateOperations) {
  return applyPatch(extendedState, extendedStateUpdateOperations || [], false, false).newDocument;
}
