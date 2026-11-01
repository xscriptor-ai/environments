// glass-surface.qml — minimal layered glass primitive for Quickshell 0.3.x.
//
// This file is a reference, not a singleton. Copy it into a shell's core/ and
// pass palette colors from the caller. The backdrop blur is done by the
// compositor:
//   * a Hyprland layer rule with `blur = true` + `ignore_alpha`, or
//   * BackgroundEffect.blurRegion on the enclosing PanelWindow/PopupWindow.
// Do not use both on the same surface (double blur).
//
// The five layers:
//   1. backdrop  — compositor blur (outside this component)
//   2. tint      — `tint` (the contrast layer)
//   3. edge      — 1 px hairline + top sheen + faint bottom darkening
//   4. depth     — RectangularShadow (QtQuick.Effects, Qt 6.9+)
//   5. texture   — optional low-opacity grain

import QtQuick
import QtQuick.Effects

Item {
    id: root

    // Tint should carry enough alpha to keep text legible on the worst-case
    // backdrop. The default is a dark smoked pane; use a light tint for light
    // palettes. The blur is decoration, not a contrast guarantee.
    property color tint: Qt.rgba(0.10, 0.11, 0.15, 0.62)
    property color edge: Qt.rgba(1, 1, 1, 0.24)
    property color sheen: Qt.rgba(1, 1, 1, 0.12)
    property color shade: Qt.rgba(0, 0, 0, 0.10)
    property color shadowColor: Qt.rgba(0, 0, 0, 0.40)

    property real cornerRadius: 16
    property real shadowBlur: 24
    property real shadowSpread: 0
    property real shadowOffsetY: 6
    property real grainOpacity: 0.0

    // Optional grain source: a small tiled PNG/SVG (2-5% opacity is enough).
    property url grainSource: ""

    // Children go inside the pane, above the sheen.
    default property alias content: contentItem.data

    // ── depth ──────────────────────────────────────────────────────────────
    RectangularShadow {
        anchors.fill: card
        radius: card.radius
        blur: root.shadowBlur
        spread: root.shadowSpread
        offset: Qt.vector2d(0, root.shadowOffsetY)
        color: root.shadowColor
    }

    // ── tint + edge ────────────────────────────────────────────────────────
    Rectangle {
        id: card
        anchors.fill: parent
        radius: root.cornerRadius
        antialiasing: true
        color: root.tint
        border.width: 1
        border.color: root.edge

        // ── edge: top sheen, bottom bounce ────────────────────────────────
        Rectangle {
            anchors.fill: parent
            anchors.margins: 1
            radius: Math.max(0, card.radius - 1)
            antialiasing: true
            gradient: Gradient {
                GradientStop { position: 0.00; color: root.sheen }
                GradientStop { position: 0.32; color: "transparent" }
                GradientStop { position: 1.00; color: root.shade }
            }
        }

        // ── texture: optional grain ───────────────────────────────────────
        Image {
            anchors.fill: parent
            visible: root.grainOpacity > 0 && root.grainSource.toString() !== ""
            source: root.grainSource
            fillMode: Image.Tile
            opacity: root.grainOpacity
            smooth: false
            // Never steal clicks from the content.
            enabled: false
        }

        // ── content ──────────────────────────────────────────────────────
        Item {
            id: contentItem
            anchors.fill: parent
            anchors.margins: 1
        }
    }
}
