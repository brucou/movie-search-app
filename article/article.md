
# Building robust, maintainable, testable user interfaces with state machines  
You just finished a client's project. Three months of crazy deadlines, constant changes in requirements and specifications, with an endless streams of bugs, but you shipped. Happy as Ulysses on his way back to Ithaca, you enjoy a few days at home and start binge-watching movies. For some reason, unhappy with the time you spent browsing through movies, you decide to create an online interface to the [The Movie Database (TMDb)](https://www.themoviedb.org/?language=en-US). It seems easy: a query field, a few network requests, and displaying the results. What could possibly go wrong?  
  
So you take your informal specifications in your mind, imagine how you would like to use the app, craft detailed specifications, user flows, design your screens, and create the application. It does not look bad:  
   
![screen shot movie app](https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20success.png)  
           
Unfortunately, it does not work quite as well as you had intended.
  
In this article, we use this simple online movie search application to explain how using explicit state machines in the modelization and implementation of user interfaces leads to **robust**, **maintainable** and **testable** interfaces. We start by describing the search application, and end by presenting the state machine formalism. In this process we will reveal how the implicit state machine complicated our code and show the advantages of using an explicit state machine instead.  
  
While the concept may be novel to some, and this article covers the subject relatively quickly, I encourage you to pause and rewind when lost, consult the code examples and related links, and post your questions on the [dedicated SO tag](https://stackoverflow.com/questions/tagged/state-transducer) or discuss the topic on the [statecharts group](https://spectrum.chat/statecharts).  
  
## The movie search app  
### Detailed specifications  
Your preliminary analysis produced detailed specifications and a set of screens corresponding to different stages of the user flow.  
  
In order to scope and guide the implementation, you write the detailed specifications of the **interface behavior** in a more formalized form, taking a chapter from BDD[^1].  
  
[^1]: Well, just a page actually. In actual BDD, you may consolidate those 11 assertions in three scenarios, with a proper syntax, and a few other things. Let's not do that for the case of this article.  
  
Including the actual screenshots from the design phase, the application behavior looks like this:  
  
<table class="tg">  
    <tr>  
        <th class="tg-0lax">Spec#</th>  
        <th class="tg-0lax">Spec</th>  
        <th class="tg-0lax">Screen</th>  
    </tr>  
    <tr>  
        <td class="tg-0lax">1</td>  
        <td class="tg-0lax">GIVEN some other url<br>WHEN user navigates to [url], <br>THEN<br>-  
            display loading screen<br>- query for movies in some default way</td>  
        <td class="tg-0lax"><img src="https://raw.githubusercontent.com/brucou/movie-search-app/specs-all/article/app%20screenshot%20init%20-%20pending.png"  
        ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">2</td>  
        <td class="tg-0lax">GIVEN user navigated to [url] <br>AND query field has not changed <br>WHEN default query is successful, <br>THEN display result screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20success.png"  
        ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">3</td>  
        <td class="tg-0lax">GIVEN url not [url] <br>AND user navigates to [url] <br>AND query field has not changed <br>WHEN default query is not successful, <br>THEN display error screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20error.png"  
        ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">4</td>  
        <td class="tg-0lax">GIVEN user navigated to [url] <br>AND query field has not changed <br>WHEN query field changes <br>AND query field is not empty, <br>THEN <br>- query for movies containing the content of  field<br>- display loading screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20pending.png" ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">5</td>  
        <td class="tg-0lax">GIVEN user navigated to [url], <br>AND query field changed <br>AND query field is not empty<br>WHEN query is successful, <br>THEN display result screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20success.png" ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">6</td>  
        <td class="tg-0lax">GIVEN user navigated to [url], <br>AND query field changed <br>AND query field is not empty<br>WHEN query is not successful, <br>THEN display error screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20init%20-%20error.png"  ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">7</td>  
        <td class="tg-0lax">GIVEN user navigated to [url] <br>AND query field changed<br>WHEN query field  
            changes <br>AND query field is empty, <br>THEN<br>- display loading screen<br>- query for  
            movies in some default way</td>  
        <td class="tg-0lax"><img src="https://raw.githubusercontent.com/brucou/movie-search-app/specs-all/article/app%20screenshot%20init%20-%20pending.png"  
        ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">8</td>  
        <td class="tg-0lax">GIVEN user navigated to [url], <br>AND query field changed <br>AND query field is not empty <br>AND query was successful<br>WHEN user clicks on a movie, <br>THEN <br>- display movie detail loading screen<br>- query for movie detail screen on top of movie screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20detail%20-%20pending.png" ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">9</td>  
        <td class="tg-0lax">GIVEN user navigated to [url], <br>AND query field changed <br>AND query  
            field is not empty <br>AND query was successful<br>AND user clicked on a movie  <br>WHEN movie detail query is successful, <br>THEN <br>- display movie detail screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20detail%20-%20success.png" ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">10</td>  
        <td class="tg-0lax">GIVEN user navigated to [url], <br>AND query field changed <br>AND query  
            field is not empty <br>AND query was successful<br>AND user clicked on a movie  <br>WHEN movie detail query is not successful, <br>THEN display movie detail error screen</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20detail%20-%20error.png" ></td>  
    </tr>  
    <tr>  
        <td class="tg-0lax">11</td>  
        <td class="tg-0lax">GIVEN user navigated to [url], <br>AND query field changed <br>AND query  
            field is not empty <br>AND query was successful<br>AND user clicks on a movie <br>AND movie detail query is successful<br>WHEN user clicks outside of the movie detail, <br>THEN display result screen corresponding to the query</td>  
        <td class="tg-0lax"><img src="https://github.com/brucou/movie-search-app/raw/specs-all/article/app%20screenshot%20query%20-%20success.png" ></td>  
    </tr>  
</table>  
  
### Implementation  
The TDD methodology leads to an implementation of the movie search application:  
  
| Spec#  | Branch  |  
|---|---|  
| 1  | [specs-S1](https://github.com/brucou/movie-search-app/tree/specs-S1)|  
| 2-3  | [specs-S2](https://github.com/brucou/movie-search-app/tree/specs-S2)|  
| 4-7  | [specs-S4](https://github.com/brucou/movie-search-app/tree/specs-S4) |  
| 1-11  | [specs-all](https://github.com/brucou/movie-search-app/tree/specs-all)|  
  
The [implementation (visible in a CodeSandbox)](https://codesandbox.io/s/jj4vrzq3wy) uses `React` exclusively as a DOM library, and uses `hyperscript` helpers, so the screens follow an html-like form. Thus you should not need to understand React for this example. We use a standard model-view-controller division:  
   
 - events are propagated to a central controller  
 - the controller elicits what actions to do, based on the current value of a model  
 - the controller performs those actions, and updates the model  
  
Take a look at the [implementation of the movie search application](https://codesandbox.io/s/jj4vrzq3wy)!  
  
## Refactoring towards state machines  
Did you notice the shape of our specifications? Abstracting over application-specific content, the specifications follow the pattern: `GIVEN state WHEN event THEN actions`. That is the *event-state-action* paradigm which can be used to describe most of the user interfaces on the web. This paradigm leads us to a refactoring with state machines.  
  
### Event-state-action paradigm  
The `(GIVEN, WHEN, THEN)` BDD triples can be written formulaically as `actions = f(state, event)`. We will call `f` the reactive function associated to the behaviour. In any of the following equations, keep in mind that any function mentioned is a mathematical function, which can be implemented programmatically by means of a pure function without side effects. Here is a partial mapping for one such function:  
  
| state | event | actions |  
|---|---|---|  
|some other url|user navigates to `[url]`|display loading screen, query for movies in some default way|  
|user navigated to `[url]`, query field has not changed |default query is successful|display result screen |  
  
While this equation is enough to specify the behavior of our interface, it is not enough to implement it: we have what is called a free variable (`state`). The equation shows that our user interface has state, but it tells us nothing about it, in particular how it evolves over time. For implementation purposes, we need a more complete description of the user interface behavior: `(actions_n, state_{n+1}) = g(state_n, event_n)`, where `n` is the index of  the `n`th event accepted by the user interface, and `state_{n+1}` is the **new state** after the event occurs. This is no discovery, a good number of front-end libraries and frameworks are using exactly that equation as their foundation. `Elm` for example revolves around an `update` function which is expressed as `update:: Msg -> Model -> (Model, Cmd Msg)`. You will recognize `Msg` as the event, `Model` as the state, and the update function as bringing a state and an event into a new state and a command depending on the triggering event (`Cmd Msg`).  
  
While there is generally only one way to match actions to a `(state, event)` couple, there are many ways to represent the state that is used internally for our interface's implementation. The provided TDD implementation for instance uses `{queryFieldHasChanged, movieQuery, results, movieTitle}`   

### State machine formalism  
There are thus many ways to implement the reactive function `f`. State machines (more precisely **Mealy machines** or **state transducers**) are a way to write the reactive function, so that it is amenable to **formal reasoning**, and **visualization**. The state machine achieves this flexibility by separating the pieces of state which are involved in control (referred to as control states) from the rest of the application state. Here is an alternative `event-state-action` mapping for our movie search application:   
  
| | State| Event| Action | New state | |  
|-----|:-----:|:-----|-----:|:-----:|:-----|  
| *Control state* | *Extended state* |   | **Actions** | *New extended state* | *New control state* |
| init | ... | USER_NAVIGATED_TO_APP | display loading screen, query database | ... | Movie querying | 
| Movie querying | ... | SEARCH_RESULTS_RECEIVED | display results screen | ... |Movie selection | 
| Movie selection | ... | QUERY_CHANGED | display loading screen, query database | ... | Movie querying | 
| Movie querying | ... | SEARCH_ERROR_RECEIVED | display error screen | ... | Movie selection error | 
| Movie selection | ... | MOVIE_SELECTED | display loading screen, query database | ... | Movie detail querying | 
| Movie detail querying | ... | SEARCH_RESULTS_MOVIE_RECEIVED | display results screen | ... | Movie detail selection | 
| Movie detail selection | ... | MOVIE_DETAILS_DESELECTED | display results screen | ... | Movie selection | 
| Movie detail querying | ... | SEARCH_ERROR_MOVIE_RECEIVED | display error screen | ... | Movie detail selection error |

The separation between control states and extended state allows us to represent the state machine visually and intuitively:  
  
![movie search explicit fsm](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20flowchart.png)  
  
The visualization semantics are relatively straightforward. The notation `EVENT / actions` gets used to define the transitions between control states. Note that we did not include in the visualization the information about internal state updates, for the sake of readability. That naturally can be done, depending on the interest of the chart's target audience.  
  
For the purpose of this article, a state machine is a **data structure** comprising:  
- events  
- control states  
- an extended state variable  
- transitions between control states, mapped to actions to be executed as a result of an event triggering the transition  
  
The previous state machine is for instance represented in a [state machine library](https://github.com/brucou/state-transducer) as:   
  
```javascript  
const movieSearchFsmDef = {  
  initialExtendedState: { queryFieldHasChanged: false, movieQuery: '', results: null, movieTitle: null },  
  states: makeStates([START, MOVIE_QUERYING, MOVIE_SELECTION, MOVIE_SELECTION_ERROR, MOVIE_DETAIL_QUERYING, MOVIE_DETAIL_SELECTION, MOVIE_DETAIL_SELECTION_ERROR]),  
  events: [USER_NAVIGATED_TO_APP, QUERY_CHANGED, SEARCH_RESULTS_RECEIVED, SEARCH_ERROR_RECEIVED, SEARCH_REQUESTED, QUERY_RESETTED, MOVIE_SELECTED, SEARCH_RESULTS_MOVIE_RECEIVED, SEARCH_ERROR_MOVIE_RECEIVED, MOVIE_DETAILS_DESELECTED],  
  transitions: [  
    { from: INIT, event: USER_NAVIGATED_TO_APP, to: MOVIE_QUERYING, action: displayLoadingScreenAndQueryDb },  
    { from: MOVIE_QUERYING, event: SEARCH_RESULTS_RECEIVED, to: MOVIE_SELECTION, action: displayMovieSearchResultsScreen },  
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
  
By **executable state machine**, we mean an implementation of the reactive function `g`, which **encapsulates (hides) its internal state**, that is, a function `fsm` such that `actions = fsm(event)`. `fsm`, having state, is not a pure function but has nonetheless interesting properties we will address when discussing testing.  
  
## Why use state machines  
Incorporating state machines early in your development process may bring the following benefits:  
  
- find design bugs early   
- reduce implementation bugs  
- iterate on features faster and more reliably  
- have an automatable and clear documentation of the interface for all members of the development team  
- pick and change front-end architecture as the need emerges
  
### Identify design bugs early  
Let's get back to our TDD implementation. The `event-state-action` mapping realized in that implementation can be represented by the following state machine:   
  
![state machine associated to the TDD implementation](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20TDD%20fsm%20actual.png)  
  
Did you see a glaring issue with our implementation? We forgot the cases for selecting a movie at the beginning of the application, before the user interacts with the query input field!  
  
Now let's have a look again at the equivalent design we produced previously:   
  
![movie search explicit fsm](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20flowchart.png)  
  
Observe that while equivalent, that design is easier to read and analyze. As a result, if you review the previous visualization, you should notice two potential problems in our specification. The `Movie detail selection error` and `Movie selection error` control states do not feature events triggering any transitions. This means that if a series of events put the machine in that control state, the machine remains indefinitely in that state (not the best user experience, and certainly not what we had in mind!).  
  
In both of these cases, we have a failure in our specifications, i.e. a **design bug**. Our state machine faithfully implements our BDD specifications, but our BDD specifications are not equivalent to our informal specifications: we forgot to consider common use cases.   
   
Design bugs, or specification errors, are particularly challenging. No amount of type checking, automated testing, or code reviews can reliably identify these issues. **To detect errors in specifications, we need to test the specification itself**. State machines provide a visual model which you can easily test-run in your head.  
  
Some modelizations are better than others when it comes to conveying the interface's behavior. Writing easily  understandable machines is a skill, which usually gets better with practice. What is interesting is that if we start directly with coding, we tend to reach implicit machines which are not very readable (the first case), but when we take the time to think about control flow and transitions in our interface (the second case), we tend to have a much clearer design which can guide technical choices and conversations with stakeholders.  
  
### Identify and reduce implementation bugs  
A state machine modelization may lead to reduced bugs at implementation time for two reasons:  
- code implementing the behaviour modelized by the state machine can be auto-generated (executable state machine)  
- the testing of the state machine can be automated.  
  
#### Automatic code generation  
It is fairly easy to write a state machine by hand. The following state machine (replicating behavior of a `Promise`):  
  
![Promise fsm](https://camo.githubusercontent.com/a1bb5b873eca74ed5b926fe1f6390e6fdc2faa42/68747470733a2f2f7261776769746875622e636f6d2f46616c65696a2f30663835393863373836343436353130613666313538643766363661386565342f7261772f303735326430623831613139346462353163376565636432386461373238656665663562623233302f66736d302e737667)  
  
can be written naively as:  
  
```javascript  
function makePromiseMachine(params) {  
  let state = {  
    control: 'pending',  
    // ... other pieces of state  
  };  
  
  return function (event) {  
    const control = state.control;  
    let output;  
  
    switch (event){  
      case 'approve':  
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
  
      default:  
        break;  
    }  
  
    return output  
  }  
}
```
  
However, doing so is not only error-prone, but also more difficult to maintain reliably. Formalizing a data structure conveying the machine semantics allows us to derive programmatically an executable version of the machine, and also tests for that machine, as we will see now (see the annex for an example library).  
   
#### Automatic test generation  
We have seen that an alternative formulation `g` of the reactive function `f` which is oriented to implementation. It is also possible to derive an equivalent, pure function `h` such that `actionsSequence = h(eventSequence)`. The benefit of that formulation: there is no longer an opaque internal state, so we can use that formulation for testing purposes, simply by feeding event sequences into the reactive function.  
  
Given a starting point (initial state of the machine), and given a sequence of events, the `h` function simply returns the sequence of actions, obtained after passing in order the sequence of events into `g`. That event sequence is very similar to a BDD user scenario.  
  
Here is a portion of the `h` functional mapping:  
  
| Event sequence | Actions sequence |  
|---|---|  
| `[USER_NAVIGATED_TO_APP]` | `[ [display loading screen, query database] ]` |  
| `[USER_NAVIGATED_TO_APP, SEARCH_RESULTS_RECEIVED]`  | `[ [display loading screen, query database], [display results screen] ]` |  
| `[USER_NAVIGATED_TO_APP, SEARCH_ERROR_RECEIVED]`  | `[ [display loading screen, query database], [display error screen] ]` |  
  
We thus have a testing methodology, but how do we generate those event sequences? A naive approach is to generate all event possibilities. For an event sequence of length `n`, and a set of events of  size `m`, that gives `m^n` possibilities of input. Even for small values of `m` and `n`,  this is fairly intractable. Additionally **many** of those test sequences will involve events  which do not produce any actions or are by construction of the interface impossible (imagine you add a button click event in the sequence, while in fact there is no such button in the screen at that moment). That is not completely uninteresting: we also want to test that our machine **does not do anything** if it receives events for which no actions are specified! However, if 90% of the test sequences goes into checking these scenarios, that leads to a significant waste of engineering effort.  
  
The good news is that because our machine is a graph (as you can see from its visualization), we can generate **interesting test sequences** simply by following the edges (transitions) of that graph. This process can be automatized through the application of graph traversal algorithms.  
  
Remember that we test for two reasons: to generate confidence in the behavior of an application and to find bugs. For confidence purposes, we can have automatic generation of tests on the predicted main paths taken by the user. For bug-finding purposes, we can have automatic generation of edge cases, error paths, negative paths, etc. Because tests are generated automatically, the incremental cost of testing is low, so we can easily run hundreds of tests with the same effort, increasing the likelihood of finding bugs early.  
  
In auto-generating the test sequences for our [movie search app](https://codesandbox.io/s/042pqzkjkn), and looking at them we found another design bug: we haven't modelized the fact that the user can still type while search queries are being executed. Improving on the previous model we get:   
  
![fsm model corrected](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart.png)  
  
Regenerating the tests for the [updated machine](https://codesandbox.io/s/2z9xrwq3mn) and we find yet another bug, which may be pretty difficult to identify from the specification or implementation. **HINT**: it is a concurrency bug (usually a challenging category of bugs)[^2]. Can you find it? By generating a **large enough number of test sequences**, we were able to eventually find a reproducing sequence for it.  

[^2]: Type fast enough, and you may generate several queries whose results arrive out of order, with the first results arriving getting displayed. Only the **latest query results** should get displayed.   
  
### Iterate on features  
After experimenting with the prototype, the UX could be improved with a few changes:  
- add a back button  
- debounce input  
- query the movie database only after three characters get entered  
- viewing movies may require being logged in depending on the rating (18+ etc.)  
- movie details could have its own route, for linkability purposes  
  
Adding, removing or modifying features requires an understanding of the interaction of those features with the application. With a state machine model, those interactions are explicit, making them easier to manage without introducing regressions.
  
Here are the corresponding updated machines for the two first changes to the specifications:  
  
| Feature | Machine |  
|---| ---|  
| back button | ![fsm model corrected with back button](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20no%20emphasis.png)|  
| debouncing | ![fsm model corrected with debounce](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20with%20back%20button%20and%20debounce.png) |  
  
The first case is easy. Clicking on the `Back` link will generate the same event as clicking outside the movie detail. We have nothing to change in the machine! The second case is not much more complicated. We use a timer to wait for accepting `QUERY_CHANGED` events.   
  
In both cases, we were able to quickly and **confidently** identify the exact part of the machine impacted by the changes and implement the modification of the behavior. We can add the debouncing feature, knowing that **it will not break other features**: we do not modify any piece of state used by any transitions involved in the other features.  
  
In both cases, we are able to fairly quickly identify the part of the machine impacted by the changes and implement the modification of the behaviour. How would you implement the other features?  
  
### Clearly and economically document the interface behavior  
Arguably the state machine for promises we visualized earlier is a useful mechanism to explain promise behavior. State machines get visualized in different ways, emphasizing different pieces of information. To discuss this approach with designers, it is possible to focus the visualization on control states and transitions. With developers, it may be preferred to include technical details such as internal state updates. For quality assurance purposes, some paths in the state machine can get emphasized (core path, error paths, etc.).  

### Fits any front-end architecture
The machine completely isolates the behavior of the user interface from other concerns, and controls the other relevant pieces of the front-end architecture through a command pattern. This has non-trivial architectural implications: the choice of a rendering engine can be reversed without modifying the machine (the behavior has not changed!); libraries to execute effects can also be swapped out at will at any point of time (e.g. [`fetch-jsonp`](https://github.com/camsong/fetch-jsonp) may be replaced by [`window.fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)). 

Concretely, you may thus start with a front-end framework which favors development speed in the prototyping phase, and switch later to another one emphasizing performance, depending on the information you gathered. Bob Martin, one of the authors of the [Agile Manifesto](https://agilemanifesto.org/), emphasized in his [*Clean Architecture and Design* talk](https://vimeo.com/68215570) how a good architecture is one which allows to delay decisions till sufficient information is available:

> The purpose of a good architecture is to defer decisions, delay decisions. The job of an architect is not to make decisions, the job of an architect is to build a structure that allows decisions to be delayed as long as possible. Why? **Because when you delay a decision, you have more information when it comes time to make it.**

To illustrate the point, here are implementations of the online movie search app among 6 front-end frameworks with diverse characteristics, with the exact same state machine:

|Framework|Possible reason for adoption|Codesandbox|
|----|----|----|
|[Vue](https://vuejs.org/)|template-based, low learning curve|[https://codesandbox.io/s/4p1nnywy0](https://codesandbox.io/s/4p1nnywy0)|
|[React](https://reactjs.org/)|large [ecosystem of components](https://reactjsexample.com/)|[https://codesandbox.io/s/ym8vpqm7m9](https://codesandbox.io/s/ym8vpqm7m9)|
|[Ivi](https://github.com/localvoid/ivi)|built to beat [performance benchmarks](https://stefankrause.net/js-frameworks-benchmark8/table.html)|[https://codesandbox.io/s/3x9x5v4kq5](https://codesandbox.io/s/3x9x5v4kq5)|
|[Inferno](https://infernojs.org/)|small, [fast, React-like API](https://infernojs.org/)|[https://codesandbox.io/s/9zjo5yx8po](https://codesandbox.io/s/9zjo5yx8po)|
|[Nerv](https://github.com/NervJS/nerv)|supports down to IE8, React-like API|[https://codesandbox.io/s/o4vkwmw7y](https://codesandbox.io/s/o4vkwmw7y)|
|[Svelte](https://github.com/sveltejs/svelte)|compiles template to vanilla JS, [small size](https://medium.freecodecamp.org/a-realworld-comparison-of-front-end-frameworks-with-benchmarks-2019-update-4be0d3c78075)|[https://github.com/brucou/movie-search-app-svelte](https://github.com/brucou/movie-search-app-svelte)|

Using state machines for modelization thus fits both monolithic and [micro-front-end architectures](https://micro-frontends.org/), the latter which encourages dividing an application into non-overlapping features, and using the more adapted technological stack for each feature.

### Final state machine implementation  
You can have a look at a [final implementation with all fixes](https://codesandbox.io/s/ym8vpqm7m9) of the online interface to the movie database using dedicated state machine libraries.  
  
## Conclusion  
Modelling user interfaces' behavior with explicit state machines produces robust and maintainable interfaces. That is the reason behind their success in safety-critical software for embedded systems (nuclear plants. air flight systems, etc.). Additionally, it allows engineers to reason easily about, and update, complex behaviors. That is why the technique is popular in modelization of the complex behavior of game agents. The automatic test and code generation can also translate in improved productivity of the development process (less debugging, less boilerplate code to create).
  
While state machine modelling is a *de facto* method for modeling complex behaviors for large applications, it is also beneficial for small applications. Even our apparently simple user interface was tricky to get right[^3]:   
  
| Before | After fixing design bugs, concurrency and error flows  |  
|---|---|  
|![](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20TDD%20fsm%20actual.png)|![](https://github.com/brucou/movie-search-app/raw/specs-all/article/movie%20search%20good%20fsm%20corrected%20flowchart%20no%20emphasis%20switchMap.png)|  

If quality and maintainability of user interfaces matters in your engineering efforts, please give this technique for state machines a look!  

[^3]: This example is inspired from [an existing app](https://sarimarton.github.io/tmdb-ui-cyclejs/dist/#/), in which we actually found three bugs (in the error paths).  

## Annex  
Implementation examples in this article are using:  
- the [state-transducer](https://github.com/brucou/state-transducer) state machine library   
- [react-state-driven](https://github.com/brucou/react-state-driven) to support integration with React  
  
As mentioned, an executable state machine being just a function, you can also write it directly. For simple cases, this may be the most efficient option. Libraries however may bring in important benefits such as automated testing and tracing.  
