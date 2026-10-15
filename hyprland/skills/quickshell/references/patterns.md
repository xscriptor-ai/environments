# Quickshell patterns that work (v0.3.x)

Battle-tested shapes for shells on Hyprland. Keep shared state OUTSIDE per-screen windows (a root `Scope`), and split files by widget (`Bar.qml`, `Clock.qml`, `Workspaces.qml`, ...).

## Bar + popup (+ outside-click dismissal)

```qml
// Bar.qml
import Quickshell
import Quickshell.Hyprland
import QtQuick
import QtQuick.Layouts

PanelWindow {
  id: bar
  anchors { top: true; left: true; right: true }
  implicitHeight: 32
  color: "transparent"                 // draw your own rounded background
  Rectangle { anchors.fill: parent; color: "#cc101014"; radius: 8 }

  RowLayout {
    anchors.fill: parent
    Workspaces { }                     // your component
    Item { Layout.fillWidth: true }
    Clock { id: clock }
  }

  PopupWindow {                        // anchored menu/OSD
    id: powerMenu
    anchor.window: bar
    anchor.rect.x: bar.width - width
    anchor.rect.y: bar.height
    implicitWidth: 240; implicitHeight: 180
    visible: false
    HyprlandFocusGrab {                // dismiss on outside click under Hyprland
      windows: [powerMenu]
      active: powerMenu.visible
      onCleared: powerMenu.visible = false
    }
  }
}
```

## Workspaces bound to Hyprland state

```qml
// Workspaces.qml
import Quickshell.Hyprland
import QtQuick

Row {
  Repeater {
    model: Hyprland.workspaces
    delegate: Rectangle {
      required property var modelData
      width: 24; height: 20; radius: 4
      color: modelData.focused ? "#7aa2f7"
           : modelData.urgent  ? "#f7768e"
           : (modelData.id === Hyprland.focusedWorkspace?.id ? "#3b4261" : "#1a1b26")
      Text { anchors.centerIn: parent; text: modelData.name }
      MouseArea { anchors.fill: parent; onClicked: modelData.activate() }
    }
  }
}
```
Rule: never shell out to `hyprctl clients` for this; `Quickshell.Hyprland` already maintains state via IPC events.

## Processes & parsing (the data layer)

```qml
Process { id: proc; command: ["wpctl", "get-volume", "@DEFAULT_AUDIO_SINK@"]; running: false
  stdout: SplitParser { onRead: line => root.volume = line }
}
Timer { interval: 2000; running: true; repeat: true; onTriggered: proc.running = true }
```
- `StdioCollector` when you want the whole output once (`onStreamFinished: this.text`).
- `SplitParser` for long-running/streaming commands (each line as it arrives).
- `FileView` + `JsonAdapter` for config/state files. `FileView.watchChanges: true` re-reads on change; `JsonAdapter` gives typed properties.
- `Process` has `manuallyStarted`, `running`; use `Quickshell.execDetached(["cmd", "arg"])` for fire-and-forget (open terminal, launcher).

## Notification server in-shell

```qml
import Quickshell.Services.Notifications

NotificationServer {
  id: server
  keepOnReload: true
  actionsSupported: true
  bodySupported: true
  imageSupported: true
  onNotification: n => { /* push into a ListView model */ }
}
```
One server per session. If SwayNC/dunst runs too, notifications go to whichever registered first — pick one.

## Tray

```qml
import Quickshell.Services.SystemTray
Repeater {
  model: SystemTray.items
  delegate: IconImage {
    required property var modelData
    source: modelData.icon
    implicitSize: 16
    MouseArea { anchors.fill: parent
      acceptedButtons: Qt.LeftButton | Qt.RightButton
      onClicked: e => e.button === Qt.LeftButton
        ? modelData.activate()
        : modelData.display(Qt.createQmlObject('import Quickshell; QsMenuOpener {}', parent))
    }
  }
}
```

## Global shortcuts from QML (no Hyprland config edits)

```qml
import Quickshell.Hyprland
GlobalShortcut {
  name: "launcher"           // referenced by compositor
  description: "Open launcher"
  onPressed: launcher.toggle()
}
```
Under the hood this registers with Hyprland's global shortcuts; apps using the compositor portal see the same registry.

## Lockscreen (WlSessionLock)

```qml
import Quickshell.Wayland
WlSessionLock {
  locked: root.locked
  WlSessionLockSurface {
    // full-screen lock UI; PAM auth via a PamContext
  }
}
```
Keep one lock component; bind `locked` to hypridle/loginctl state. Auth: `PamContext.start()/respond()`.

## IPC control surface (for scripts & CI)

```qml
import Quickshell.Io
IpcHandler {
  target: "bar"
  function toggle() { ... }
  function visible(): bool { return rooted.visible }
}
```
Then: `qs ipc call bar toggle`, `qs ipc prop get bar visible`, `qs ipc listen bar signalName yourSignal`. This is the cleanest automation/testing seam (no PID hunting).

## Theming & system style

- Provide your own theme singleton (`Theme.qml` with `pragma Singleton`) and use it everywhere; read the `settings.json` + active palette via `FileView` watch (equisdots base16+roles contract — see `design-and-effects.md` §2). Palettes are data written by the generator binary; the shell only derives roles.
- `//@ pragma RespectSystemStyle` only if you actually follow the system Qt style; otherwise Quickshell forces Fusion for consistency.
- Icons: prefer `Quickshell.iconPath("name")` with fallback handling; SNI icons come from `SystemTrayItem.icon`.

## Multi-monitor rules of thumb

- One `Variants { model: Quickshell.screens; ... }` per visual component group; never create multiple bar roots for the same screen.
- Compute per-screen behavior from the delegate's `modelData` (a `ShellScreen`), not from `Hyprland.focusedMonitor` (wrong for non-focused screens).
- OSDs should follow the focused monitor: bind `screen: Hyprland.focusedMonitor?.screen ?? Quickshell.screens[0]`.
