# QML for Quickshell authors (Qt 6, v0.3.x, Oct 2026)

The 80% of QML you need for shells, plus the scoping/binding rules that cause most bugs. Full tutorial: quickshell.org/docs/v0.3.2/guide/qml-language/.

## Document structure

```qml
import QtQuick            // module import (version optional in Qt6)
import QtQuick.Controls
import Quickshell         // [as QS] to namespace
import qs.widgets.bar     // Quickshell module import (relative to shell.qml's folder)
import "utils.js" as Utils

Item {                    // root object
  id: root                // lowercase id, unique per file, usable across the file
  property int count: 0   // property definition
  width: 100              // binding
  height: width           // reactive binding
  signal clicked(int x)   // signal declaration
  function dub(n: int): int { return n * 2 }  // function
  Component.onCompleted: console.log("ready") // attached handler
}
```

- Types/objects start uppercase; properties/ids lowercase. Namespace names must start uppercase (`import Quickshell as QS`).
- Semicolons optional, but recommended inside functions/expressions.
- Every file's imports are its own; imports don't cascade.

## Properties & bindings (the core mental model)

- A property assignment is a **binding**, not a one-shot value: it re-evaluates whenever any property it reads changes. `height: width` follows `width` forever.
- Last line of a multi-line binding is the returned value; `return` also works in `{}` blocks.
- Imperative writes (`root.count = 5`) **destroy the binding**. Re-establish it with `root.count = Qt.binding(() => other.value)` or avoid imperative writes.
- `required property` forces the creator to supply a value (used by per-screen `Variants` delegates with `modelData`).
- `readonly property` + binding is the safe "derived value" pattern.
- Scope: a property is visible if defined on the current object or on the file's root object; everything else must be accessed through an id. `parent` exists but often surprises — use ids.
- Bindings evaluate lazily and can be circular — Qt warns (`QML ... Binding loop detected`) and freezes that value at the last stable state.
- Avoid heavy JS in bindings (they run on the GUI thread, potentially often). Move work to `Process`/`FileView` and keep bindings cheap.
- `property var` accepts anything (no type checking); prefer typed properties.

## Functions, lambdas, signals

```qml
function add(a: int, b: int): int { return a + b }
property var op: n => n * 2                  // lambda value
signal done(string result)
onDone: (result) => console.log(result)      // handler with parameter
```

- Functions are hoisted per file; lambdas capture locals.
- Signal handlers: `on<SignalName>` with parameters; properties also emit `<prop>Changed` (`onWidthChanged`) — for `var`-typed props this is the only change signal.
- Attached objects: `Component.onCompleted`, `Component.onDestruction`, `Keys.onPressed`, `Loader.onLoaded`.
- `Connections { target: obj; function onSomething() {...} }` for foreign signals — note the `function onFoo` spelling.

## Creating types

- **Same folder, uppercase file** = implicit type (`Bar.qml` -> `Bar {}`) — this is the standard way to structure a Quickshell config.
- **Inline component**: `component Icon: Text { ... }` inside a file.
- **Singleton**: `pragma Singleton` file (e.g. `Theme.qml`) — one instance, global state; reference as `Theme`. Quickshell also supports `//@ pragma Singleton`.
- **Modules via `qs.` imports** for subfolders; keep types uppercase so the QML engine finds them.

## Lists, models, repeaters

- `Repeater { model: list; delegate: ... }` inside `RowLayout`/`ColumnLayout` — for short, non-scrolling lists (tray items, workspaces).
- `ListView { model: ...; delegate: ... }` — long/scrolling lists (launchers, notifications stack).
- `ObjectModel` (Quickshell) for object lists; `ScriptModel` for JS-driven generators; `Variants` for one-instance-per-screen.
- Delegates get `modelData` (plain lists) or named roles (models with roles). Use `required property` in delegates with `Variants`/repeaters.

## Quickshell pragmas (file-level)

```qml
//@ pragma Internal          // hide file from module consumers
//@ pragma Singleton
//@ if hasVersion(0, 3, 2)   // C-preprocessor-like gating; evaluate JS: hasVersion/hasQtVersion/env/isEnvSet
//@ pragma UseQApplication   // QtWidgets-based styles (qqc2-desktop-style) — root shell.qml only
//@ pragma RespectSystemStyle // do not force Fusion controls style
//@ pragma DropExpensiveFonts // skip woff/woff2 font files
//@ pragma IconTheme <name>   // QS_ICON_THEME
//@ pragma AppId <id>         // QS_APP_ID — taskbar/window identity
//@ pragma ShellId <id>       // stable dirs/instance identity across symlinked paths
//@ pragma Env VAR = VAL      // affects Quickshell itself (not spawned processes)
//@ pragma DefaultEnv VAR = VAL // sets VAR only if unset
//@ endif
```

## Common QML traps in shell code

1. Reading `parent.width` from inside nested layouts — layouts can re-parent; anchor to ids instead.
2. Mutating a bound property (`width = 200`) silently kills reactivity for that property.
3. Doing string/array processing in a `text:` binding on a hot property (e.g. clock) — prefer a `Timer`/`Process` updating a `property string`.
4. Forgetting `required property var modelData` in `Variants`/Repeater delegates -> `modelData is undefined` at load.
5. `qmlls` silently stops helping when braces are unbalanced — fix structure first, lints later.
6. `var` properties don't notify unless you reassign the whole value; mutate-then-reassign (`arr = [...arr, x]`) instead.
