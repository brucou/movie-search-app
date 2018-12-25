# Building robust, maintainable user interfaces with state machines
So, you just finished a client's project. This were three months of crazy deadlines, and
constant changes in specifications, and endless streams of bugs, but you did it. Happy as Ulysses 
on his way back to Ithaka, you are looking forward to the loving arms of Penelope. That, and 
sitting in the sofa and do some movie-binging as in the old days. For some reasons, unhappy of 
the time you spent browsing through movies, you decide but of course, Sir confident programmer will 
make an online interface to the [The Movie Database (TMDb)](https://www.themoviedb.org/?language=en-US).
It is easy, a query field, a few network requests, displaying results, what can possibly go 
wrong?

So you take the informal specifications in your head, imagine how you would like to use the app, 
craft detailed specifications, user flows, design your screens, and do the programming. It does 
not look bad. If it was not for all those bugs...

In this article, we are going to use this simple online movie search application to showcase the 
benefits of using explicit state machines in the modelization and implementation of user 
interfaces. We start with describing the search application, and end up presenting the state 
machine formalism. In the process we will reveal the implicit state machine complected in our 
code and show how state machine modeling leads to robust and maintainable interfaces.

[some nice words, we will abundantly use code examples, some concepts may be novel to you, don 
give up or something like that]

## The movie search app
Your preliminary analysis produced detailed specifications and a set of screens corresponding to 
different stages of the user flow.

### Detailed specifications
In order to scope and guide the implementation, you write the detailed specifications of the 
**interface behaviour** in a more formalized form, taking a page from BDD[^1] :
 
```gherkin
1. GIVEN some other url
 - WHEN user navigates to [url], THEN 
   - display loading screen
   - query for movies in some default way
2. GIVEN user navigated to [url] AND query field has not changed 
 - WHEN default query is successful, THEN display (result screen) 
3. GIVEN url not [url] AND user navigates to [url] AND query field has not changed 
 - WHEN default query is not successful, THEN display (error screen)
4. GIVEN user navigated to [url] AND query field has not changed 
 - WHEN query field changes AND query field is not empty, THEN 
   - query for movies containing the content of <query> field
   - display loading screen
5. GIVEN user navigated to [url], AND query field changed AND query field is not empty
 - WHEN query is successful, THEN display (result screen)
6. GIVEN user navigated to [url], AND query field changed AND query field is not empty
 - WHEN query is not successful, THEN display (error screen). 
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
 - WHEN user clicks outside of the movie detail, THEN display (result screen) corresponding to
  the query
```

[^1]: In actual BDD, you would actually consolidate those 11 assertions in two or three scenarios,
 and adopt whatever syntax of the BDD tool under use. 

In terms of visual design, it would go like this :

![6](./app%20screenshot%20query%20-%20error.png)

| Spec#  | Screen  |
|---|---|
| 1  |  ![1](./app%20screenshot%20init%20-%20pending.png)|
| 2  | ![2](./app%20screenshot%20init%20-%20success.png)|
| 3  | ![3](./app%20screenshot%20init%20-%20error.png) |
| 4  | ![4](./app%20screenshot%20query%20-%20pending.png) |
| 5  | ![5](./app%20screenshot%20query%20-%20success.png) |
| 6  | ![6](./app%20screenshot%20query%20-%20error.png) |
| 7  |  ![1](./app%20screenshot%20init%20-%20pending.png) |
| 8  | ![8](./app%20screenshot%20query%20detail%20-%20pending.png) |
| 9  | ![9](./app%20screenshot%20query%20detail%20-%20success.png) |
| 10  | ![9](./app%20screenshot%20query%20detail%20-%20error.png) |
| 11  | ![5](./app%20screenshot%20query%20-%20success.png) |

### Implementation
The TDD methodology leads to an implementation which can be found here:

TODO : put the branches

| Spec#  | Screen  |
|---|---|
| 0  |  ![0](./TODO|
| 1  |  ![1](https://github.com/brucou/movie-search-app/tree/specs-S1)|
| 2-3  | ![2-3](https://github.com/brucou/movie-search-app/tree/specs-S2|
| 4-7  | ![4-7](https://github.com/brucou/movie-search-app/tree/specs-S4 |
| 8-11  | ![8-11](https://github.com/brucou/movie-search-app/tree/specs-S8|

 React was chosen as a DOM library. Even if you don't know React, you should be able to 
 understand the implementation pretty well. To that purpose, we are using hyperscript helpers, 
 which allow to write the screens in a way very similar to html. Apart from the React twist, we 
 use a standard model-view-controller division :
 - events are propagated to a central controller
 - the controller elicits what actions to do, based on the current value of a model
 - the controller perform those actions, and updates the model

The key takeaway from the bottom-up TDD implementation is that there is no need to imagine in 
advance how screens could be divided into components. Instead, components may appear in the TDD 
refactoring phase, with a view to eliminating repetition. In our demo, we haven't given any 
thoughts to refactoring.

## Refactoring towards state machines
Did you notice the form of our specifications ? Abstracting over application-specific content, 
the specifications follow the pattern : `GIVEN state WHEN event THEN actions`. That is the 
*event-state-action* paradigm which can be used to describe most of the user interfaces we see 
daily on the web. That paradigm leads us to a refactoring with state machines.

### Event-state-action paradigm
The BDD triple can be written formulaically as `actions = f(state, event)`. While this equation is 
enough to specify the behaviour of our interface, it is not enough to implement it. The equation 
shows that our user interface has state, but it does not concern itself with how the interface's state 
  evolves over time. For implementation purposes, we need a more complete description of the user 
  interface behaviour : $(actions_n, state_n+1) = f(state_n, event_n)$, where `n` is the index of
   the `n`th event accepted by the user interface. This is no discovery, a good number of 
   front-end libraries and frameworks are using exactly that equation as their foundation. Elm 
   for example revolves around an update function which is expressed as `update :: Msg -> Model -> (Model, Cmd Msg)`. 
  You will recognize `Msg` as the event, `Model` as the state, and the update function as 
  bringing a state and an event into a new state and a command depending on the triggering event.

   While there is generally only one way to match actions to a `(state, event)` couple (e.g. `f` 
   is generally a **pure function**, and we will call `f` the reactive function), there are many 
   ways to represent the state that we will use internally for our interface specification. The provided 
   TDD implementation for instance uses  `{queryFieldHasChanged, movieQuery, results}` as state. 
   Here is an equivalent formulation :

   TABLE
   | State {step, results, movieQuery} | Event | Action | New state | 
   | init, [], '' | navigated | display loading screen , query db | movie querying, [], ''
   | movie querying, [], '' | successful query | display results screen | movie selection, [...], ''
   | ... | .. | ...  | ... finish it

### State machine formalism
There are thus many ways to write the reactive function `f`. State machines (more 
precisely **Mealy machines** or **state transducers**) are a way to write the reactive function, so 
that it is amenable to **formal reasoning**, and **visualization**. It does so by segregating the 
pieces of state which are involved in control (duely referred to as control states) from the rest
 of the application state. Our previous `event-state-action` mapping can be turned into : 
 
 | Control state | Extended state | Event | Action | New Extended state | New Control state |
| only a few of previous | ... |

The reactive function introduced there above can be represented as the 
following state transducer :  

![movie search explicit fsm](./movie%20search%20good%20fsm.png)

The visualization semantics are pretty straight forward. For instance, from the visualization one
 can deduce that the machine starts in the `init` control state, and on receiving the 
 `USER_NAVIGATED_TO_APP` event, it transitions to the `Movie querying` control state, with the 
 actions `display loading screen, query database` being emitted by the machine. Note that we did 
 not include in the visualization the information about internal state updates, for the sake of 
 readability. That can naturally be done, depending on the target audience for the visualization.

In the rest of the article, we will primarily refer to as state machine, a data structure 
comprising :
- a set of control states
- an extended state variable
- a set of transitions between control states, linking an origin control state, a target control 
state, and actions to be executed as a result of taking the transition

By executable state machine, we will mean an implementation of the reactive function `f`. 

## Why use state machines
Incorporating state machines early in your development process may bring you the following 
benefits :

- find design bugs early 
- reduce implementation bugs
- iterate on features faster and more reliably
- have an automatable and clear documentation of the interface for all the team


### Identify design bugs early
Let's get back at our TDD implementation. We can associate the following state machine to that 
implementation : 

![state machine associated to the TDD implementation](movie%20search%20TDD%20fsm%20actual.png)

What escaped us when writing the specifications is made more obvious : we forgot the cases for 
selecting a movie at the beginning of the application, when the query input field has not been 
interacted with. <maybe add the cases in - - - >

At first sight, we cannot derive much more information from that particular machine design. Let's
 have a look again at the equivalent design we produced previously : 

![movie search explicit fsm](./movie%20search%20good%20fsm.png)

While equivalent, that design is easier to read and analyze. As a result,
if you look long enough at the previous visualization, you should be able to spot two potential 
problems in our specification. The `Movie detail selection error` and `Movie selection error` 
control states do not feature events triggering any transition. This means that if a series of 
events put the machine in that control state, the machine remains indefinitely in that state. 

In both introduced cases, we have a failure in our specifications, i.e. a **design bug**. Our state 
machine faithfully implements our BDD specifications, but our BDD specifications are not equivalent to our
 informal specifications. We forgot to consider some cases.

Writing state machines helps identify early design bugs, by explicitly identifying the control 
flow implied by the user interface behaviour. As we have seen, some modelization are better than 
others when it comes to convey the interface's behaviour. Writing easily understandable machines 
is a skill, which like any other, gets better with time. What is interesting is that if we start 
directly with coding, we tend to reach implicit machines which are not very readable (the first 
case), while when we take the time to think about control flow and transitions in our interface, 
we tend to have a much clearer design which can guide technical choices and conversations with 
stakeholders.

### Identify and reduce implementation bugs
A state machine modelization may lead to reduced bugs at implementation time for two reasons :
- code implementing the behaviour modelized by the state machine can be auto-generated
- the testing of the state machine, can be automated.

#### Automatic code generation
It is fairly easy to write a state machine by hand. The following state machine (replicating 
behaviour of a `Promise`):

![Promise fsm](https://camo.githubusercontent.com/a1bb5b873eca74ed5b926fe1f6390e6fdc2faa42/68747470733a2f2f7261776769746875622e636f6d2f46616c65696a2f30663835393863373836343436353130613666313538643766363661386565342f7261772f303735326430623831613139346462353163376565636432386461373238656665663562623233302f66736d302e737667)

can be written as :

```javascript
function makePromiseMachine(params) {
  let state = {
    control : 'pending',
    // ... other pieces of state
  };

  return function updatePromiseWith(event) {
    const control = state.control;
    let output;

    switch (event){
      case 'approve' :
        switch (control) {
          case 'pending':
            // update state, update output
            state.control = 'approved'
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
            break;

          case 'approved':
            // update state, update output
            state.control = 'rejected'
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
            break;

          case 'approved':
            // update state, update output
            state.control = 'pending'
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

However, doing so is not only error-prone, but also harder to maintain reliably. With extra 
formalization, it is possible to generate executable state machines from the data structure 
defining the machine. A number of libraries exist to do so and can be found at the end of the article.

In the measure that those libraries do their job without introducing bugs, it is thus possible to
 get the machine-modelized behaviour implemented free of bugs.
 
#### Automatic test generation
We have seen that a reactive function can be implemented with a state transducer which internally 
manages a state such that : `actions = f(state, event)`, and `f` being a pure function.  From 
`f`, it is also possible to derive an equivalent function `g` such that `actionsSequence = g
(eventSequence)`, and `g` is a pure function. The attractiveness of that formulation is there is 
no longer mention of an opaque internal state, which means we can use that formulation for 
testing purposes, simply by feeding event sequences into the function.

Given a starting point (initial state), and given a sequence of events, the `g` function simply 
returns the sequence of actions, obtained after passing in order the sequence of events into `f`.
 That event sequence is very similar to a BDD user scenario.

Here is an example of trace :

TODO : add from the movie search gallery example a table with two columns ?

| [USER...]  | [action sequence] |

We thus have a testing methodology but how do we generate those event sequences? A naive approach
 is to generate all event possibilities. For an event sequence of length `n`, and a set of events
 of  size `m`, that gives `m^n` possibilities of input. Even for small values of `m` and `n`, 
 this is fairly intractable. Exhaustively consuming the test space leads to a test time growing 
 exponentially with the length of the event sequence. Additionally a lot of those test sequences 
 will involve events which do not produce any actions or are by construction of the interface 
 impossible (imagine you add a button click event in the sequence, while in fact there is no such
  button in the screen at that moment). Given the infinite size of the test space, what we want is
 to maximize the value of our tests and pick from that test space a manageable, finite set which 
 guarantee the correctness of user scenarios of interest. 

The good news is that because our machine is a graph (as you can see from its visualization), we 
can generate 'valid' test sequences simply by following the edges (transitions) of that graph. 
This process can be automatized through application of the usual graph traversal algorithms. 

We did that for our movie search app, and we found yet another bug, which is pretty difficult to 
identify from the specification or implementation. We query a database for any change in the 
movie input field. When we receive a query result, we display those results (`Movie selection` 
control state). If we type fast enough, we may generate several queries whose results arrive in 
any order, and the first results arriving get displayed. Per our informal specifications, it 
should be only the latest query results which should be displayed. This is a concurrency bug, the
 hardest kind of bugs to track and reproduce. However by generating a large number of test 
 sequences, we were able to eventually find a reproducing sequence.

Because tests are generated automatically, the incremental cost of testing is low, so we can run 
easily hundreds of tests with the same effort. We explore a larger portion of the test 
space, we find more bugs.

The composition of the test sequence (e.g. user flow) can still be adjusted programmatically, so we 
can produce test sequences which use what we know about the user or the expected risks. This is the 
best of both worlds. In our application, we can produce test sequences geared towards the core 
user flow, which is checking movie details. We, at the same time, can produce test sequences 
focusing on concurrency issues (long sequence of concurrent requests).

Remember that we test for two reasons : to generate confidence in the behaviour of the application,
 and to find bugs. For confidence purposes, we can have automatic generation of tests on the 
 (imagined) main paths taken by the user. For bug-finding purposes, we can have automatic 
 generation of edge cases, error paths, etc.

`maybe add a picture with paths with different width in the graph!!`

### Iterate on features
add/remove/update. Let's start with remove! the slicing problem etc.

### Document clearly and economically the interface behaviour
State machines can be visualized in different ways, emphasizing on different pieces of 
information. To discuss with designers, it is possible to focus the visualization on the 
control states and transitions. To discuss with developers, it may be preferred to include 
technical details such as internal state updates, and other relevant notes. For quality assurance
 purposes, some paths in the state machine can be emphasized (core path, error paths, etc.). We show
  in the article state  machines visualization with different levels of detail. 

In any case, state machines can be instrumented into a documentation source, facilitating the
 team work between stakeholders of an user interface implementation project : developers, 
 designers, scrum master, project manager, etc. This goes to reinforce the previous point, as 
 better communication through the sharing of a unique and commonly understood artifact, also 
 lowers the probability of design bugs.

## Who uses it ?
link who uses it with the benefits :
- robustness -> critical safety software
- design bugs/iteration/documentation -> gaming system (well also mastering complexity??)

## Conclusion
da da link with F1-F4 or just remove Fx and rewrite the introduction? Maybe rewrite the 
introduction? don't know. but emphasize hte unicity of state machines. What other tool help you 
find design bug that early in the process? what other tool allow you to get robustness through 
automatic test and implementation code generation? What other tool allow you to picture quickly 
the impact of a new feature?

As we mentioned, you can already incorporate state machines in your workflow. Their 
implementation is pretty straight forward. It involves mostly control flow in the shape of a 
combination of control structures (if/then/else). So the entry bar is pretty low.

However, tooling and libraries exists which may help on the journey. Here is a summary of 
resources available. Just put the link from my hugo blog, don't reproduce it here

If quality, and maintainability of user interfaces matters is important in what you do, give it a 
look.

There is more. When we specify the `event-state-action` relation, we are signalling among all 
possibilities for the triple, those which are valid. What is easily forgot is that we are also 
signalling those triples which are **not** valid. For instance, given the machine is in `Movie 
detail selection` control state, when the event `QUERY_CHANGED` occurs, there will be no reaction
 (i.e. transition taken by the machine), hence the machine will not output any actions to execute. 
 

Componentization, as promoted by most popular front-end libraries and 
frameworks, seeks to divide that complexity into more manageable chunks that can be addressed 
separately and independently.

In `Challenges of [user interface] design and implementation`, 

WAY TOO LONG!!!
cf. https://wordcounter.net/
ask if 3000 words include the examples too... but way way too long!!


 ...
 
 with the following screens designed by the faviourite designer. 
 
 Nice. You refined a pretty nebulous informal specif (a movie search app) into detailed 
 specifications. you follow the TDD process and get to a working prototype relatively quickly. 
 
 The only problem is that you got it wrong, and your application has several important bugs, some
  easy to picture, some less. Does that feel like deja-vu?
  
  We will introduce in this article state machines as a modeling and implementation technique for
   user interfaces. Coding interfaces as explicit state machines may allow you to reach higher 
   quality user interfaces faster. 

## the event-state-action paradigm
take it from there
