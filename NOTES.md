# Learnt : General
- CATCH ERRORS in promises and systematically LOG THEM
  - a lot of the time I spent with the issues below are due to error swallowing
- jsx camelcase => uncamelled in html
  - data-activePage => data-active-page
  - onClick => onclick
- className => class
- querySelectorAll returns a NodeList not an array. Does not have a map method, but a forEach only
- setImmediate does not exist in the browser. So react-testing-library bugs. must mock 
setImmediate for setTimeout 0
- apparently it is `oninput` not `onchange` for change in input fields with React
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

# Learnt : Config
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

# Progression
- S0: shell : https://codesandbox.io/s/yjwpx1wn8j
- S1: loading : https://codesandbox.io/s/vvymn2qn3l
- S2-3: init results ok : https://codesandbox.io/s/y2yljrzxj1
- S2-3: init results error : https://codesandbox.io/s/y2yljrzxj1
- S4-7 : (NO TEST yet) https://codesandbox.io/s/4j95n6pn04
- S8-all
