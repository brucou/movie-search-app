# Building robust, maintainable, testable user interfaces with state machines
So, you just finished a client's project. Three months of crazy deadlines, 
constant changes in specifications, with an endless streams of bugs, but you did it. Happy as 
Ulysses on his way back to Ithaka, you enjoy a few days at home and start binge-watching movies. 
For some reasons, unhappy of the time you spent browsing through movies, you decide, you 
confident programmer, will make an online interface to the [The Movie Database (TMDb)](https://www.themoviedb.org/?language=en-US).
It is easy, a query field, a few network requests, displaying results, what can possibly go 
wrong?

So you take the informal specifications in your head, imagine how you would like to use the app, 
craft detailed specifications, user flows, design your screens, and do the programming. It does 
not look bad. If it was not for all those bugs...

In this article, we are going to use this simple online movie search application to explain how 
using explicit state machines in the modelization and implementation of user 
interfaces leads to **robust**, **maintainable** and **testable** interfaces. We start with 
describing the search application, and end up presenting the state machine formalism. In the process we will reveal 
the implicit state machine complected in our code and show the advantages of using an explicit 
one instead.

While the concept may be novel to some, and this article covers the subject relatively fast, I 
encourage you to pause and rewind when lost, consult the code examples (I try to link an 
example at every step, so click on the links), and post your questions on the [dedicated SO tag](https://stackoverflow.com/questions/tagged/state-transducer) or come and discuss the topic on the [statecharts group](https://spectrum.chat/statecharts).

## The movie search app
Your preliminary analysis produced detailed specifications and a set of screens corresponding to 
different stages of the user flow.

### Detailed specifications
In order to scope and guide the implementation, you write the detailed specifications of the 
**interface behaviour** in a more formalized form, taking a chapter from BDD[^1] :

```gherkin
1. GIVEN some other url
 - WHEN user navigates to [url], THEN 
   - display loading screen
   - query for movies in some default way
2. GIVEN user navigated to [url] AND query field has not changed 
 - WHEN default query is successful, THEN display result screen 
3. GIVEN url not [url] AND user navigates to [url] AND query field has not changed 
 - WHEN default query is not successful, THEN display error screen
4. GIVEN user navigated to [url] AND query field has not changed 
 - WHEN query field changes AND query field is not empty, THEN 
   - query for movies containing the content of <query> field
   - display loading screen
5. GIVEN user navigated to [url], AND query field changed AND query field is not empty
 - WHEN query is successful, THEN display result screen
6. GIVEN user navigated to [url], AND query field changed AND query field is not empty
 - WHEN query is not successful, THEN display error screen. 
7. GIVEN user navigated to [url] AND query field changed
 - WHEN query field changes AND query field is empty, THEN 
   - display loading screen
   - query for movies in some default way
8. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query 
was successful 
 - WHEN user clicks on a movie, THEN 
   - display movie detail loading screen
   - query for movie detail screen on top of movie screen 
9. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful AND user clicked on a movie  
 - WHEN movie detail query is successful, THEN 
   - display movie detail screen
10. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful AND user clicked on a movie  
 - WHEN movie detail query is not successful, THEN 
   - display movie detail error screen
11. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful AND user clicks on a movie AND movie detail query is successful
 - WHEN user clicks outside of the movie detail, THEN display result screen corresponding to
  the query
```

[^1]: Well, just a page actually. In actual BDD, you may consolidate those 11 
assertions in three scenarios, with a proper syntax, and a few other things. Let's 
not bother, shall we.

In terms of visual design, it would go like this :

| Spec#  | Screen  |
|---|---|
| 1  |  ![1](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20pending.png)|
| 2  | ![2](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20success.png)|
| 3  | ![3](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20error.png) |
| 4  | ![4](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20pending.png) |
| 5  | ![5](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20success.png) |
| 6  | ![6](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20error.png) |
| 7  |  ![1](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20pending.png) |
| 8  | ![8](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20detail%20-%20pending.png) |
| 9  | ![9](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20detail%20-%20success.png) |
| 10  | ![9](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20detail%20-%20error.png) |
| 11  | ![5](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20success.png) |

### Implementation
The TDD methodology leads to an implementation which can be found here:

| Spec#  | Branch  |
|---|---|
| 1  |  [specs-S1](https://github.com/brucou/movie-search-app/tree/specs-S1)|
| 2-3  | [specs-S2](https://github.com/brucou/movie-search-app/tree/specs-S2)|
| 4-7  | [specs-S4](https://github.com/brucou/movie-search-app/tree/specs-S4) |
| 1-11  | [specs-all](https://github.com/brucou/movie-search-app/tree/specs-all)|

The [implementation](https://frontarm.com/demoboard/?id=84de78ec-a59c-452e-899a-4ddcf73a746a) 
uses `React` exclusively as a DOM library, and uses hyperscript helpers, so the screens follow an 
html-like form. Thus you should not need understand React. We use a standard model-view-controller 
division :
 
 - events are propagated to a central controller
 - the controller elicits what actions to do, based on the current value of a model
 - the controller performs those actions, and updates the model

Have a look!

## Refactoring towards state machines
Did you notice the shape of our specifications ? Abstracting over application-specific content, 
the specifications follow the pattern : `GIVEN state WHEN event THEN actions`. That is the 
*event-state-action* paradigm which can be used to describe most of the user interfaces we see 
on the web. That paradigm leads us to a refactoring with state machines.

### Event-state-action paradigm
The `(GIVEN, WHEN, THEN)` BDD triples can be written formulaically as `actions = f(state, event)`.
 We will call `f` the reactive function associated to the behaviour. In any of the equations we 
 will write in what follows, keep in mind that any function mentioned is a mathematical function, 
 which can be implemented programmatically by means of a pure function. Here is a partial mapping :

| state | event | actions |
|---|---|---|
|some other url|user navigates to `[url]`|display loading screen, query for movies in some default way|
|user navigated to `[url]`, query field has not changed |default query is successful|display result screen |

While this equation is enough to specify the behaviour of our interface, it is not enough to 
implement it : we have what is called a free variable (`state`). The equation 
shows that our user interface has state, but it tells us nothing about it, in particular how it 
evolves over time. For implementation purposes, we need a more complete description of the user 
 interface behaviour : `(actions_n, state_{n+1}) = g(state_n, event_n)`, where `n` is the index of
 the `n`th event accepted by the user interface, and `state_{n+1}` is the **new state** after the 
 event occurs. This is no discovery, a good number of front-end libraries and frameworks are using 
 exactly that equation as their foundation. `Elm` for example revolves around an `update`
 function which is expressed as `update :: Msg -> Model -> (Model, Cmd Msg)`. You will
 recognize `Msg` as the event, `Model` as the state, and the update function as bringing a state 
 and an event into a new state and a command depending on the triggering event (`Cmd Msg`).

While there is generally only one way to match actions to a `(state, event)` couple, there are 
many ways to represent the state that is used internally for our interface's implementation. 
The provided TDD implementation for instance uses  `{queryFieldHasChanged, movieQuery, results, movieTitle}` 

### State machine formalism
There are thus many ways to implement the reactive function `f`. State machines (more 
precisely **Mealy machines** or **state transducers**) are a way to write the reactive function, so 
that it is amenable to **formal reasoning**, and **visualization**. It does so by segregating the 
pieces of state which are involved in control (duely referred to as control states) from the rest
 of the application state. Here is an alternative `event-state-action` mapping for our movie search application : 

| | State| Event| Action | New state | |
|-----|-----|:-----:|:-----:|:-----|:-----|
| *Control state* | *Extended state* | **Event** | **Actions** | *New extended state* | *New control state* |
| init | ... | USER_NAVIGATED_TO_APP | display loading screen, query database | ... | Movie querying | 
| Movie querying | ... | SEARCH_RESULTS_RECEIVED | display results screen | ... |Movie selection | 
| Movie selection | ... | QUERY_CHANGED | display loading screen, query database | ... | Movie querying | 
| Movie querying | ... | SEARCH_ERROR_RECEIVED | display error screen | ... | Movie selection error | 
| Movie selection | ... | MOVIE_SELECTED | display loading screen, query database | ... | Movie detail querying | 
| Movie detail querying | ... | SEARCH_RESULTS_MOVIE_RECEIVED | display results screen | ... | Movie detail selection | 
| Movie detail selection | ... | MOVIE_DETAILS_DESELECTED | display results screen | ... | Movie selection | 
| Movie detail querying | ... | SEARCH_ERROR_MOVIE_RECEIVED | display error screen | ... | Movie detail selection error | 

The segregation between control states and extended state allows to represent visually and 
intuitively the state machine :

![movie search explicit fsm](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20flowchart.png)

The visualization semantics are pretty straight forward. The notation `EVENT / actions` is used 
to define the transitions between control states. Note that we did not include in the 
visualization the information about internal state updates, for the sake of readability. That 
naturally can be done, depending on the interest of the chart's target audience.

For the purpose of this article, a state machine is a **data structure** comprising :
- events
- control states
- an extended state variable
- transitions between control states, mapped to actions to be executed as a result of 
an event triggering the transition

The previous state machine is for instance represented in a [state machine library](https://github.com/brucou/state-transducer) as : 

```javascript
const movieSearchFsmDef = {
  initialExtendedState: { queryFieldHasChanged: false, movieQuery: '', results: null, movieTitle: null },
  states: makeStates([START, MOVIE_QUERYING, MOVIE_SELECTION, MOVIE_SELECTION_ERROR, MOVIE_DETAIL_QUERYING, MOVIE_DETAIL_SELECTION, MOVIE_DETAIL_SELECTION_ERROR]),
  events: makeEvents([USER_NAVIGATED_TO_APP, QUERY_CHANGED, SEARCH_RESULTS_RECEIVED, 
  SEARCH_ERROR_RECEIVED, SEARCH_REQUESTED, QUERY_RESETTED, MOVIE_SELECTED, 
  SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_ERROR_MOVIE_RECEIVED, MOVIE_DETAILS_DESELECTED]),
  transitions: [
    { from: INIT, event: USER_NAVIGATED_TO_APP, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryDb },
    {
      from: MOVIE_QUERYING, event: SEARCH_RESULTS_RECEIVED, to: MOVIE_SELECTION, action: displayMovieSearchResultsScreen
    },
    { from: MOVIE_SELECTION, event: QUERY_CHANGED, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryNonEmpty },
    {
      from: MOVIE_QUERYING,
      event: SEARCH_ERROR_RECEIVED,
      to: MOVIE_SELECTION_ERROR,
      action: displayMovieSearchErrorScreen
    },
    {
      from: MOVIE_SELECTION,
      event: MOVIE_SELECTED,
      to: MOVIE_DETAIL_QUERYING,
      action: displayDetailsLoadingScreenAndQueryDetailsDb
    },
    {
      from: MOVIE_DETAIL_QUERYING,
      event: SEARCH_RESULTS_MOVIE_RECEIVED,
      to: MOVIE_DETAIL_SELECTION,
      action: displayMovieDetailsSearchResultsScreen
    },
    {
      from: MOVIE_DETAIL_QUERYING,
      event: SEARCH_ERROR_MOVIE_RECEIVED,
      to: MOVIE_DETAIL_SELECTION_ERROR,
      action: displayMovieDetailsSearchErrorScreen
    },
    {
      from: MOVIE_DETAIL_SELECTION,
      event: MOVIE_DETAILS_DESELECTED,
      to: MOVIE_SELECTION,
      action: displayCurrentMovieSearchResultsScreen
    },
  ],
}

```

By **executable state machine**, we mean an implementation of the reactive function `g`, which 
**encapsulates (hide) its internal state**, that is, a function `fsm` such that `actions = fsm
(event)`. `fsm`, having state, is not a pure function but has nonetheless interesting properties 
we will address when discussing testing.

## Why use state machines
Incorporating state machines early in your development process may bring the following 
benefits :

- find design bugs early 
- reduce implementation bugs
- iterate on features faster and more reliably
- have an automatable and clear documentation of the interface for all the team

### Identify design bugs early
Let's get back at our TDD implementation. The `event-state-action` mapping realized in that 
implementation can be represented by the following state machine : 

![state machine associated to the TDD implementation](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20TDD%20fsm%20actual.png)

Did you picture a glaring issue with our implementation? We forgot the cases for 
selecting a movie at the beginning of the application, when the query input field has not been 
interacted with!

Now let's have a look again at the equivalent design we produced previously : 

![movie search explicit fsm](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20flowchart.png)

Observe that while equivalent, that design is easier to read and analyze. As a result,
if you look long enough at the previous visualization, you should be able to spot two potential 
problems in our specification. The `Movie detail selection error` and `Movie selection error` 
control states do not feature events triggering any transitions. This means that if a series of 
events put the machine in that control state, the machine remains indefinitely in that state (not
 the best UX, certainly not what we had in mind).

In both introduced cases, we have a failure in our specifications, i.e. a **design bug**. Our state 
machine faithfully implements our BDD specifications, but our BDD specifications are not equivalent to our
 informal specifications : we forgot to consider some cases. 
 
 Design bugs, or specification errors, are particularly tough. No amount of type 
 checking, automated testing, and code reviews can reliably crack that nut open. **To detect errors 
 in specification, we need to test the specification itself**. State machines provide a visual 
 model which you can easily test-run in your head.

As we have seen, some modelization are better than others when it comes to conveying the 
interface's behaviour. Writing easily  understandable machines is a skill, which, like any other,
 gets better with time. What is interesting is that if we start directly with coding, we tend to
  reach implicit machines which are not very readable (the first case), while when we take the 
  time to think about control flow and transitions in our interface (the second case, we tend to 
  have a much clearer design which can guide technical choices and conversations with stakeholders.

### Identify and reduce implementation bugs
A state machine modelization may lead to reduced bugs at implementation time for two reasons :
- code implementing the behaviour modelized by the state machine can be auto-generated 
(executable state machine)
- the testing of the state machine, can be automated.

#### Automatic code generation
It is fairly easy to write a state machine by hand. The following state machine (replicating 
behaviour of a `Promise`):

![Promise fsm](https://camo.githubusercontent.com/a1bb5b873eca74ed5b926fe1f6390e6fdc2faa42/68747470733a2f2f7261776769746875622e636f6d2f46616c65696a2f30663835393863373836343436353130613666313538643766363661386565342f7261772f303735326430623831613139346462353163376565636432386461373238656665663562623233302f66736d302e737667)

can be written naively as :

```javascript
function makePromiseMachine(params) {
  let state = {
    control : 'pending',
    // ... other pieces of state
  };

  return function (event) {
    const control = state.control;
    let output;

    switch (event){
      case 'approve' :
        switch (control) {
          case 'pending':
            // update state, update output
            state.control = 'approved'
            output = ...
            break;

          default:
            break;
        }
        break;

      case 'reject':
        switch (control) {
          case 'pending':
            // update state, update output
            state.control = 'rejected'
            output = ...
            break;

          case 'approved':
            // update state, update output
            state.control = 'rejected'
            output = ...
            break;

          default:
            break;
        }
        break;

      case 'pend':
        switch (control) {
          case 'rejected':
            // update state, update output
            state.control = 'pending'
            output = ...
            break;

          case 'approved':
            // update state, update output
            state.control = 'pending'
            output = ...
            break;

          default:
            break;
        }
        break;

      default :
        break;
    }
      
    return output
  }
}

```

However, doing so is not only error-prone, but also harder to maintain reliably. Formalizing 
a data structure conveying the machine semantics allows to derive programmatically an 
executable version of the machine, and also tests for that machine, as we will see now (I wrote 
a library that does just that, see in annex).
 
#### Automatic test generation
We have seen that an alternative formulation `g` of the reactive function `f` which is oriented to 
implementation. It is also possible to derive an equivalent function `h` such that 
`actionsSequence = h(eventSequence)`. The attractiveness of that formulation is there is no 
longer mention of an opaque internal state, which means we can use that formulation for testing 
purposes, simply by feeding event sequences into the reactive function.

Given a starting point (initial state of the machine), and given a sequence of events, the `h` 
function simply returns the sequence of actions, obtained after passing in order the sequence of 
events into `g`. That event sequence is very similar to a BDD user scenario.

Here is a portion of the `h` functional mapping :

| Event sequence | Actions sequence |
|---|---|
| `[USER_NAVIGATED_TO_APP]` | `[ [display loading screen, query database] ]` |
| `[USER_NAVIGATED_TO_APP, SEARCH_RESULTS_RECEIVED]`  | `[ [display loading screen, query database], [display results screen] ]` |
| `[USER_NAVIGATED_TO_APP, SEARCH_ERROR_RECEIVED]`  | `[ [display loading screen, query database], [display error screen] ]` |

We thus have a testing methodology, but how do we generate those event sequences? A naive approach
 is to generate all event possibilities. For an event sequence of length `n`, and a set of events
 of  size `m`, that gives `m^n` possibilities of input. Even for small values of `m` and `n`, 
 this is fairly intractable. Additionally **a lot** of those test sequences will involve events 
 which do not produce any actions or are by construction of the interface impossible (imagine you
 add a button click event in the sequence, while in fact there is no such button in the screen 
  at that moment). That is not completely uninteresting : we also want to test that our machine 
  **does not do anything** if it receives events for which no actions are specified! However, if 
  90% of the test sequences goes into checking that, that is a lot of waste.

The good news is that because our machine is a graph (as you can see from its visualization), we 
can generate **interesting test sequences** simply by following the edges (transitions) of that 
graph. This process can be automatized through application of the usual graph traversal algorithms.

Remember that we test for two reasons : to generate confidence in the behaviour of the application,
 and to find bugs. For confidence purposes, we can have automatic generation of tests on the 
 predicted main paths taken by the user. For bug-finding purposes, we can have automatic 
 generation of edge cases, error paths, negative paths, etc. Because tests are generated 
 automatically, the incremental cost of testing is low, so we can run easily hundreds of tests 
 with the same effort, increasing the likelihood to find a bug.

We autogenerated test sequences for our [movie search app](https://frontarm.com/demoboard/?id=da063993-aec1-4812-9343-c5309b556e41), and looking at them we found another design bug : we haven't modelized the fact that the user can still type while search queries are 
being executed. Improving on the previous model we get : 

![fsm model corrected](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart.png)

We regenerated tests for the [updated machine](https://frontarm.com/demoboard/?id=ffa7c61d-b3b4-448b-996f-39599465cb3e) and we found yet another bug, which may be pretty difficult to identify from the specification or implementation. **HINT** : it is a concurrency 
bug (an usually tough category of bugs)[^2]. Can you find it? By generating a **large 
enough number of test sequences**, we were able to eventually find a reproducing sequence for it.
 
[^2]: Type fast enough, and you may generate several queries whose results arrive out of order, 
with the first results arriving get displayed. Only the **latest query results** should be 
displayed. 

### Iterate on features
After playing a bit with the prototype, it seems like the UX could be improved with a few changes :
- add a back button
- debounce input
- query the movie database only after three characters are entered
- viewing movies may require to be logged in depending on rating (18+ etc.)
- movie details could have its own route, for linkability purposes

Adding, removing or modifying features requires an understanding of the interaction of those 
features with the application. With a state machine model, those interactions are explicit. 

Here are the corresponding updated machines for the two first changes to the specifications :

| Feature | Machine |
|---| ---|
| back button | ![fsm model corrected with back button](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20no%20emphasis.png)|
| debouncing | ![fsm model corrected with debounce](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20with%20back%20button%20and%20debounce.png) |

The first case is easy. Clicking on the `Back` link will generate the same event as clicking 
outside the movie detail. We have nothing to change in the machine! The second case is not much 
more complicated. We use a timer to wait for accepting `QUERY_CHANGED` events. 

In both cases, we were able to quickly and **confidently** identify the exact part of the machine
 impacted by the changes and implement the modification of the behaviour. We can add the 
 debouncing feature, knowing that **it will not break other features** : we do not modify any 
 piece of state used by any transitions involved in the other features.

In both cases, we are able to fairly quickly identify the part of the machine impacted by the 
changes and implement the modification of the behaviour. How would you implement the other features?

### Document clearly and economically the interface behaviour
Arguably the state machine for promise we visualized earlier is a useful support to explain 
 promise behaviour to a profane crowd. State machines can be visualized in different ways, 
 emphasizing on different pieces of information. To discuss with designers, it is possible to 
 focus the visualization on control states and transitions. With developers, it may be preferred 
 to include technical details such as internal state updates. For quality assurance
 purposes, some paths in the state machine can be emphasized (core path, error paths, etc.). 

### Final state machine implementation
You can have a look at the [final implementation with all fixes](https://codesandbox.io/s/ym8vpqm7m9) of the online interface to the movie database using dedicated state machine libraries.

## Conclusion
Modelling user interfaces' behaviour with explicit state machines produces robust and 
maintainable interfaces. That is the reason behind their success in safety-critical software for 
embedded systems (nuclear plants. air flight systems, etc.). Additionally, it allows to reason 
easily about, and update, complex behaviours. That is why the technique is popular in modelization of the complex behaviour
 of game agents. The automatic test and code generation can also translate in improved 
 productivity of the development process (less debugging, less code to write).

While state machine modelling is a de facto method for modeling complex behaviours in the 
large, it is also beneficial in the small. Even our apparently simple user interface was tricky 
to get right[^3]: 

| Before | After fixing design bugs, concurrency and error flows  |
|---|---|
|![](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20TDD%20fsm%20actual.png)|![](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20no%20emphasis%20switchMap.png)|

Did I manage to excite your curiosity or did I loose you somewhere along the 
way? If quality, and maintainability of user interfaces matters in what you do, give
 the technique a look. You know, it is just a function!

[^3]: This example is inspired from [an existing app](https://sarimarton.github.io/tmdb-ui-cyclejs/dist/#/), in which we actually found three bugs (in the error paths).

## Annex
Implementation examples in this article are using :
- the [state-transducer](https://github.com/brucou/state-transducer) state machine library 
- [react-state-driven](https://github.com/brucou/react-state-driven) to support integration with React

As we mentioned, an executable state machine being just a function, you can also write it 
directly. For simple cases, this may be the cheapest option. Libraries however may bring in 
important goodies such as automated testing, or tracing.

Interesting articles shedding light on the subject :
- [How to visually design state in JavaScript](https://medium.freecodecamp.org/how-to-visually-design-state-in-javascript-3a6a1aadab2b)
- [Pure UI](https://rauchg.com/2015/pure-ui)

I barely touched the surface of the subject. Other areas of interest I might touch in other articles if you guys give positive feedback :
- modelling user interface with state machines : a hands-on approach
- state machine, state charts, and componentization against complexity
- how to incorporate state machines in your favorite framework
- model- and property-based testing for user interfaces
