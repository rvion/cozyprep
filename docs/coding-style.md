# No-Bullshit TypeScript Style Guide

## Ground rules

* Optimize both for brevity and clarity.
* Prefer Small functions.
* Prefer early returns over nested blocks.
* prefer method with foo =() => ... just to avoid binding this, and to have single line functions
* feel free to use methods like `foo = () => void (this.x++)` to keep them single line
* mobx setup with `configure({ enforceActions: "never" })` so using `this.x++` in methods is perfectly fine
* never use `switch`. Always prefer dedicated functions with early return or lookup maps.
* No unsafe TS. Avoid `any`, `!` (non-null), `as any`, `@ts-ignore`. Prefer `unknown` + proper narrowing.
* Strict everything. `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
* Fail fast. Throw typed errors at boundaries; keep core pure.

## Always think where should methods should live

- POJO are bad for important state.
- Always uses classes for everything.
- make class take their context as parameter
  - if `Game` class instance instanciate a `World` class instance, and if a `World` instanciate `Entity`, make Game inject self (this) as first public constructor param of World, and World would inject this as first public constructor param of class Entity so any entities can access world as this.world, or game as this.world.game.
  - When you have tree of class, always make parent class inject selves in constructor so classes created can access their parent context (Class that create them).

- method should not be afraid of passing `this` to sub methods or other class
- not everyting need an interface. never use interface if you can pass an existing object as reference.
- treat every instance API as something that will be used across the codebase by all class that will receive an instance reference.

## Function style

* **Early return**:

  ```ts
  function save(u: User) {
    if (!isValid(u)) return Result.err('invalid');
    return repo.save(u);
  }
  ```
* Replace `switch` with **lookup**/**small functions**:

  ```ts
  const handler: Record<Action['type'], (a: Action) => void> = {
    open: a => open(a.id),
    close: a => close(a.id),
  };
  handler[action.type](action);
  ```
* Public functions **declare return types**. Inference is fine for locals.

## Collections

* Last element: `list.at(-1)` (not `list[list.length - 1]`).

## Objects

* Index signatures are explicit: `Record<string, T>` (with `noUncheckedIndexedAccess`).

## Async

* Always `await` promises you create; no floating promises.
* Use `Promise.all` for parallelism; `AbortController` for cancellable APIs.
* Don’t swallow errors—propagate or handle once.

## Errors

* Throw **Error** (or refined subclass) with actionable message.
* Don’t return mixed unions like `T | Error`. Use `Result` type or throw.

## Nullish & booleans

* Prefer `??` (default), `?.` (optional chain); avoid `||` for defaulting unless you mean falsy.
* Compare explicitly; don’t rely on truthiness of numbers/strings.

## Comments & docs

* always prefer shorter syntax if available
* prefer One-line comments like that: `/** does X */` rather than multiline blocs if one line is enough
  (do not use multi-line boilerplate when you only have one sentence)
* Link to specs/tickets when relevant.

## Dependencies

* Be stingy. Prefer stdlib, small utilities over heavy frameworks.

### Tiny “Do/Don’t” sampler

* ✅ `if (!ok) return;`  ❌ nested `if/else`
* ✅ `list.at(-1)`    ❌ `list[list.length - 1]`
* ✅ `const x: unknown` + guard ❌ `let x: any`
* ✅ `import type { Foo }`   ❌ value import for types


## React rules

- Avoid too many hooks, they're hard to read, prefer stable methods via local state methods
- if your component needs a state, use a local mobx state instead cached with useMemo pattern
- alwyas use mobx and mobx-react-lite
- usePropsAsStableObservableObject when you need to pass props to your local state
- basically most components will look a bit like that
```tsx
import { observer } from "mobx-react-lite"
import { usePropsAsStableObservableObject } from "./usePropsAsStableObservableObject"
import { makeAutoObservable } from "mobx"
import { useMemo } from "react"
export type MyComponentProps = { a: 1 }
class MyComponentState {
    constructor(public p: MyComponentProps) {
        makeAutoObservable(this)
    }
    counter = 0
}
export const MyComponent = observer((p: MyComponentProps) => {
    p = usePropsAsStableObservableObject(p)
    const uist = useMemo(() => new MyComponentState(p), [])
    return <div>{uist.counter}</div>
})
```