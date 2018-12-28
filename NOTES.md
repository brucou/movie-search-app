- we will use innerHtml on the app element of the html
- this creates and destroys dom elements, so there is no need to keep track of listeners
- now fast this is, that is a good question... we will see
- to optimize it is always possible to split the app element html into slow and fast part, and 
check for the slow part changes. If changes then redraw, if no changes, then leave as is. That 
requires anchors for the slow and fast parts

# Learnt
- CATCH ERRORS in promises and systematically LOG THEM
  - a lot of the time I spent with the issues below are due to error swallowing
- jsx camelcase => uncamelled in html
  - data-activePage => data-active-page
  - onClick => onclick
- className => class
- querySelectorAll returns a NodeList not an array. Does not have a map method, but a forEach only
- setImmediate does not exist in the browser. So react-testing-library bugs. must mock 
setImmediate for setTimeout 0
- apparently it is `oninput` not `onchange` for change in input fields
- AVOID mispelling when pasting like lost ' or " SUPER ANNOYING
- BUG with `` : ${string}\> includes the \ inside the string
- be careful with dom-testing-library to put the arguments in the right position - no error 
signalling most of the time
  - don't use so much waitForDomChange if it runs after the DOM is changed then it detects 
  nothing. It can work if for isntance images are loaded async, and the dom changes but imagees 
  are not loaded yet, problem!! use `wait` and `getByTestId` if necessary rather than 
  `waitForElement`, that makes only one API to learn 
- STATE!!
  - made the mistake to run several tests without resetting the state of the app in the init
- be careful with dom-testing-library with stuff happening on the same data-test-id
  - that makes it indeterminate to discriminate with wait. It sometimes get the first stuff 
  happenned, sometimes after the second...
  - make a specific test id to discriminate!
- using innerHTML for rendering means that I loose focus on input fields
  - generally i loose the DOM state by recreating the DOM!!!

# Learnt Config
- qunit better included in the html if webpack (the import works, but the function QUnit.module 
etc. do not produce any effect)
- had to put in webpack.config.js to avoid annoying issues with react-app-presets or whatever 
that was coming from...,. 
```
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
```
and also put a .babelrc
```javascript
{
  "presets": ["@babel/env", "react-app"]
}
```

# State machines benefits
- original implementation does not show anything in case of network error on initial load!!
- we don't do debounce in vanilla js implementation for now, or maybe we should

# progression
- S0: shell : https://codesandbox.io/s/yjwpx1wn8j
- S1: loading : https://codesandbox.io/s/vvymn2qn3l
- S2-3: init results ok : https://codesandbox.io/s/y2yljrzxj1
- S2-3: init results error : https://codesandbox.io/s/y2yljrzxj1
- S4-7 : (NO TEST yet) https://codesandbox.io/s/4j95n6pn04
- S8-all

# transducer API : https://github.com/jlongster/transducers.js
- transduce(coll, xform, reducer, init?) — Like reduce, but apply xform to each value before passing to reducer. If init is not specify it will attempt to get it from reducer.
- transducer (xform) needs a reducer to tell it how to build the result. In other words, it is 
monoid?
- xform takes a reducer : xform(reducer) is a function (result, x) which returns a new result. So
 x is the new value here, and result is the reduced value from the old result value
- xform (reducer) is a reducer!! i.e. a transducer!!
- so reducer here is the original reducer, the building reducer!!
- so coll knows how to iterate, reducer knows how to build results, xform transforms reducers
- so for observable it is possible to have transduce(obs, xform, subject, init?); subject is 
also the result
- so I can do that will callbacks?
  - subject = event emitter
  - obs?? something with a subscribe method, so could have a eventEmitter to observable method 
  that means obs would be an event emitter
- so transduce(emitter, xform, emitter, init) - just need to work on the API!!

- FAN IN:
  - easy? at the emitter level, you can have emitter = merge([emitter])
  - could also have xform = xxform(emitter2, emitter3) and transduce(emitter1, xform...)
  - or write an overload of transduce : merge([emitter]) = transduce(emitter1, xform...)

- FAN OUT
  - we return an event emitter so just add as many listeners to that as necessary

- combination of FAN IN and FAN OUT
  - transducer always return whatever the build reducer returns meaning an emitter 
  - so transduce(merge([emitter]), xform, emitter, init) mmm cannot fan out? has to do in several
   steps
   - transduce(merge([fan in emitter]), xform, emitter, init)
   - then emitter.listen([fan out emitter])
   - That could easily be made into something visualizable with metadata
   - everything xform could have a name, or should it be the emitter? to think about

# http://lucasmreis.github.io/blog/contents/
- explain to him that he is doing state machine really in his react patterns

# DSL for state machines
- I can use state litterals!!! pass action functions in ${} it works!!! incredible

Guards:
---
function xxx()
---

Actions :
---
function xxx(){}
test if closure can be used this is evaluated so probably ??
---
Given ST1, When EV And guard THEN xxx
or 
ST1 => ST2 when EV AND guard
ST1 => ST2 on EV if guard

amazing world
