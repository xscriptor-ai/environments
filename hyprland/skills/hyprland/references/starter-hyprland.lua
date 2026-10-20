-- Starter Hyprland Lua config for Hyprland 0.56.x (Lua 5.5 era).
-- Copy to ~/.config/hypr/hyprland.lua, then edit the monitor, keyboard and
-- autostart entries for your machine.
--
-- Verify before launching:
--   Hyprland --verify-config
-- After launching:
--   hyprctl configerrors
--
-- Deep references: skill hyprland-lua (hl.* API), skill hyprland (options/rules),
-- skill hyprland-tools (lock/idle/wallpaper), skill quickshell (shell).

-- Monitors: the empty output is the fallback for every unlisted monitor.
hl.monitor({ output = "", mode = "preferred", position = "auto", scale = "auto" })
-- Example explicit monitor:
-- hl.monitor({ output = "DP-1", mode = "2560x1440@165", position = "0x0", scale = 1 })

-- Environment for Wayland clients.
hl.env("XCURSOR_SIZE", "24")
hl.env("QT_QPA_PLATFORM", "wayland;xcb")
hl.env("QT_QPA_PLATFORMTHEME", "qt6ct")

hl.config({
  general = {
    gaps_in = 5,
    gaps_out = 20,
    border_size = 2,
    layout = "dwindle",
    allow_tearing = false,
  },
  decoration = {
    rounding = 10,
    blur = { enabled = true, size = 8, passes = 3 },
  },
  input = {
    kb_layout = "us",
    follow_mouse = 1,
    sensitivity = 0,
    touchpad = { natural_scroll = true, tap_to_click = true },
  },
  animations = { enabled = true },
})

hl.curve("snappy", { type = "spring", mass = 1, stiffness = 120, dampening = 14 })
hl.animation({ leaf = "windows", enabled = true, speed = 8, spring = "snappy" })

-- Core keybinds. Adjust the terminal and launcher to what you install.
hl.bind("SUPER + RETURN", hl.dsp.exec_cmd("kitty"))
hl.bind("SUPER + Q", hl.dsp.window.close())
hl.bind("SUPER + M", hl.dsp.exit())

for i = 1, 9 do
  hl.bind("SUPER + " .. i, hl.dsp.focus({ workspace = tostring(i) }))
  hl.bind("SUPER + SHIFT + " .. i, hl.dsp.window.move({ workspace = tostring(i) }))
end

hl.bind("SUPER + left", hl.dsp.focus({ direction = "left" }))
hl.bind("SUPER + right", hl.dsp.focus({ direction = "right" }))
hl.bind("SUPER + up", hl.dsp.focus({ direction = "up" }))
hl.bind("SUPER + down", hl.dsp.focus({ direction = "down" }))

hl.bind("SUPER + F", hl.dsp.window.fullscreen({ mode = "fullscreen" }))
hl.bind("SUPER + V", hl.dsp.window.float())
hl.bind("SUPER + L", hl.dsp.exec_cmd("hyprlock"))
hl.bind("PRINT", hl.dsp.exec_cmd([[grim -g "$(slurp)" - | wl-copy]]))

-- Small rules that keep common dialogs usable.
hl.window_rule({ match = { class = "^(pavucontrol|nm-connection-editor)$" }, float = true })

-- Optional: blur the Quickshell bar by namespace (requires the shell namespace).
hl.layer_rule({ match = { namespace = "^(quickshell)$" }, blur = true, ignore_alpha = 0.15 })

-- Autostart: only start what is installed. Prefer systemd user units for
-- long-running daemons when you need supervision; these are session helpers.
hl.on("hyprland.start", function()
  hl.exec_cmd("hyprpaper")
  hl.exec_cmd("hypridle")
  hl.exec_cmd("hyprpolkitagent")
  -- hl.exec_cmd("qs -c bar")  -- enable after installing a Quickshell config
end)
