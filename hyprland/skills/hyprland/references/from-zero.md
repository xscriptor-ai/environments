# From zero to a working Hyprland session (Arch Linux)

Verified 2026-10-20 against Hyprland v0.56.2, Quickshell v0.3.2 and current Arch packages.

This is the end-to-end path the other references assume: an Arch base is already installed, the network works, and you have a normal user with `sudo`. It covers drivers, packages, session entry, a starter config, desktop services, verification and first-boot troubleshooting.

For the Arch base itself (partitions, bootloader, users), use `archinstall` or the official Arch installation guide; this page starts after that.

## 1. Decisions before installing

Choose one component per role to avoid duplicate daemons:

| Role | Recommended | Notes |
|---|---|---|
| Session | `start-hyprland` from a TTY, or a Wayland display manager | The wrapper adds crash recovery and safe mode. |
| Shell/bar | Quickshell | Alternative: Waybar + SwayNC. |
| Notifications | Quickshell NotificationServer, or dunst/swaync | Never run two servers. |
| Tray | Quickshell SystemTray, or one SNI host | Never run two SNI hosts. |
| Lock/idle | hyprlock + hypridle | Use `loginctl lock-session` for integration. |
| Wallpaper | hyprpaper | Or a shell/daemon that owns the background. |
| Portals | xdg-desktop-portal-hyprland + xdg-desktop-portal | Remove conflicting GNOME/KDE backends. |

## 2. Base packages and drivers

Install the GPU driver for the machine, the microcode for the CPU, and the desktop packages. Adjust the lists; package names can differ by repository.

### GPU and firmware

| Hardware | Packages |
|---|---|
| AMD | `mesa vulkan-radeon libva-mesa-driver` |
| Intel | `mesa vulkan-intel intel-media-driver` |
| NVIDIA | `nvidia-open` or `nvidia` (match the kernel), plus `nvidia-utils` |

Also install `linux-firmware`, and `amd-ucode` or `intel-ucode` for the CPU. Add the microcode image to the bootloader configuration.

NVIDIA notes:

- Enable kernel modeset (`nvidia_drm.modeset=1` in the kernel command line).
- The historical environment trio (`GBM_BACKEND=nvidia-drm`, `__GLX_VENDOR_LIBRARY_NAME=nvidia`, `LIBVA_DRIVER_NAME=nvidia`) is a diagnostic aid, not a default. Add it only if the compositor cannot start or hardware decode fails.
- On hybrid laptops, verify which GPU drives the output with `hyprctl systeminfo` and `drm_info`; use `AQ_DRM_DEVICES` only when device order is wrong.

### Desktop packages

```bash
sudo pacman -S --needed base-devel git \
  hyprland hyprland-guiutils \
  xdg-desktop-portal xdg-desktop-portal-hyprland \
  polkit hyprpolkitagent \
  pipewire pipewire-pulse wireplumber alsa-ucm-conf \
  networkmanager bluez bluez-utils \
  qt6-wayland qt5-wayland qt6ct \
  noto-fonts ttf-nerd-fonts-symbols \
  kitty wl-clipboard cliphist grim slurp \
  hyprpaper hyprlock hypridle hyprpicker
```

Optional, depending on the chosen stack:

```bash
# Quickshell shell (Arch extra)
sudo pacman -S --needed quickshell

# Screenshots (community package, Arch extra)
sudo pacman -S --needed hyprshot

# Audio/network/Bluetooth GUIs
sudo pacman -S --needed pavucontrol nm-connection-editor blueman

# File manager and image viewer
sudo pacman -S --needed thunar imv
```

Hack Nerd Font is not in the official repositories on every image. Install `ttf-nerd-fonts-symbols` for the symbols and a Hack Nerd Font package from the AUR or the font upstream if the shell expects it.

### Services

```bash
sudo systemctl enable --now NetworkManager
sudo systemctl enable --now bluetooth        # only if Bluetooth is used

systemctl --user enable --now pipewire pipewire-pulse wireplumber
```

Portals are normally D-Bus activated. Verify them after the first session start; do not enable random portal backends:

```bash
systemctl --user status xdg-desktop-portal xdg-desktop-portal-hyprland
```

## 3. Session entry

Test the compositor from a TTY before configuring a display manager:

```bash
Hyprland --verify-config
start-hyprland
```

`start-hyprland` is the supported entrypoint since 0.53. It provides crash recovery and safe mode. Do not start the bare `Hyprland` binary in normal use.

For a display manager, install SDDM or greetd and select the packaged Hyprland Wayland session (`/usr/share/wayland-sessions/hyprland.desktop`). A plain TTY plus `start-hyprland` is also a valid setup. If the display manager fails, test the same session from a TTY with:

```bash
dbus-run-session start-hyprland
```

UWSM is optional; use it only if you want a systemd-managed session. Since the 0.55 era the Hyprland session target is integrated; remove old manual `systemctl` lines from configs.

## 4. Starter config

Copy the starter from this skill to the config path and edit it:

```bash
mkdir -p ~/.config/hypr
cp ~/.config/opencode/skills/hyprland/references/starter-hyprland.lua \
   ~/.config/hypr/hyprland.lua
```

The starter includes:

- a fallback monitor rule
- Wayland/Qt environment variables
- general, decoration and input defaults
- a spring curve and a window animation
- core binds, workspaces 1-9, fullscreen/float/lock/screenshot
- a dialog float rule and an optional Quickshell layer-blur rule
- `hl.on("hyprland.start", ...)` autostart

Edit at least:

- `hl.monitor(...)` for the real output, mode and scale
- `input.kb_layout` and the touchpad settings
- the terminal command (`kitty`) and any optional autostart entries

Verify again:

```bash
Hyprland --verify-config
hyprctl reload
hyprctl configerrors
```

### File layout and modules

Keep the root file small and split by concern:

```text
~/.config/hypr/
  hyprland.lua
  config/
    monitors.lua
    input.lua
    binds.lua
    rules.lua
    autostart.lua
  scripts/
```

In `hyprland.lua`:

```lua
require("config.monitors")
require("config.input")
require("config.binds")
require("config.rules")
require("config.autostart")
```

Each required file runs in its own scope. A broken module aborts its own file; guard optional modules with `pcall` when experimenting. See skill `hyprland-lua` for the full `hl.*` API and load semantics.

## 5. First session checklist

Start with `start-hyprland`, then verify the pieces in this order:

1. `hyprctl version` and `hyprctl monitors -j` show the running version and outputs.
2. `hyprctl configerrors` is empty.
3. The configured binds work: terminal, close, workspace switch, fullscreen, float, exit.
4. `wpctl status` lists a sink and `speaker-test` is audible.
5. `nmcli device status` shows the network device; Wi-Fi can be enabled.
6. `bluetoothctl show` runs if Bluetooth is installed.
7. `systemctl --user status xdg-desktop-portal xdg-desktop-portal-hyprland` shows both active.
8. `grim -l 1 /tmp/test.png` captures the screen.
9. `wl-copy test` then `wl-paste` returns `test`.
10. `loginctl lock-session` locks the session; unlocking works through PAM.
11. One shell instance is running (`qs list`), with no second bar or notification server.
12. `hyprctl layers -j` shows the expected namespaces.

## 6. Desktop services and stack

### Audio

PipeWire + WirePlumber are the default. Check:

```bash
wpctl status
wpctl set-default <sink-id>
speaker-test -c 2 -t sine -l 1
```

If there is no sink, check `systemctl --user status pipewire wireplumber` and `journalctl --user -u pipewire -u wireplumber`.

### Network

NetworkManager is the expected backend:

```bash
nmcli device status
nmcli radio wifi on
nmcli device wifi list
```

A shell can own the network UI, but NetworkManager still does the work.

### Portals and screen sharing

Both the generic portal and the Hyprland backend must be available:

```bash
systemctl --user status xdg-desktop-portal xdg-desktop-portal-hyprland
journalctl --user -u xdg-desktop-portal -u xdg-desktop-portal-hyprland
```

Remove or disable conflicting GNOME/KDE portal backends. Test with `grim -l 1`, then OBS or another PipeWire screen-share client. If `ecosystem.enforce_permissions` is enabled, the compositor prompts on first capture; pre-authorize with `hl.permission(...)` when needed.

### Clipboard and screenshots

`wl-clipboard` provides `wl-copy`/`wl-paste`; `cliphist` adds history. A Quickshell clipboard panel can drive it. For screenshots:

```bash
grim -g "$(slurp)" - | wl-copy
```

`hyprshot` wraps region/output/window capture if installed.

### Notifications and tray

Run exactly one notification server and one SNI tray host:

- Quickshell: `Quickshell.Services.Notifications` and `Quickshell.Services.SystemTray`.
- Or dunst/swaync plus a single tray host.

If notifications vanish or tray icons duplicate, look for two hosts.

### Lock and idle

```bash
hyprlock          # test manually
hypridle          # start from autostart
loginctl lock-session
```

hyprlock and hypridle use their own config files; see skill `hyprland-tools` and `references/ecosystem.md`. Keep the lock command on a bind and test PAM before relying on it.

### Wallpaper

hyprpaper uses `~/.config/hypr/hyprpaper.conf`:

```text
preload = /path/to/wallpaper.png
wallpaper = eDP-1,/path/to/wallpaper.png
ipc = on
```

Start it from `hl.on("hyprland.start", ...)`. If a shell or a wallpaper daemon owns the background, do not also run hyprpaper.

### Shell or bar

A minimal Quickshell shell is a folder with `shell.qml`:

```bash
mkdir -p ~/.config/quickshell/bar
# create ~/.config/quickshell/bar/shell.qml
qs -c bar
```

Start it from the Hyprland autostart. One Quickshell process can host the bar, popups, OSDs, notification center, tray and lock-adjacent UI. See skill `quickshell` for the API and design system; Waybar is the low-effort alternative.

## 7. Fonts, cursor and Qt

```bash
fc-list | grep -i "Hack Nerd"
hyprctl setcursor <theme> 24
```

- Set `XCURSOR_SIZE` before the session and keep the cursor theme consistent.
- `QT_QPA_PLATFORM=wayland;xcb` lets Qt clients fall back to XWayland when needed.
- `QT_QPA_PLATFORMTHEME=qt6ct` plus `qt6ct` keeps Qt apps consistent.
- Do not set a global `QT_SCALE_FACTOR`; use the monitor `scale` in `hl.monitor`.
- For GTK apps, set the theme and font in the usual GTK settings; a tool such as `nwg-look` helps.

## 8. Monitors, scale, VRR, HDR and tearing

Start with the fallback monitor rule, then add explicit rules:

```lua
hl.monitor({ output = "eDP-1", mode = "preferred", position = "0x0", scale = 1 })
hl.monitor({ output = "DP-1", mode = "2560x1440@165", position = "1920x0", scale = 1, vrr = 1 })
```

- `scale` must divide the resolution cleanly.
- `vrr`: -1 follow, 0 off, 1 on, 2 fullscreen-only, 3 fullscreen+video/game.
- HDR fields (`bitdepth`, `cm`, `sdr_eotf`) depend on the monitor and GPU; change one at a time.
- Tearing is opt-in: `general.allow_tearing = true` plus the `immediate` window rule for the specific app.
- Verify with `hyprctl monitors -j`; never stack overlapping monitor positions.

## 9. First-boot troubleshooting

- **Black screen or no outputs:** switch to a TTY, run `start-hyprland -- --safe-mode`, then check `hyprctl monitors -j`, kernel logs for amdgpu/i915/nvidia, and the monitor rule. On NVIDIA, verify modeset. On hybrid or multi-GPU systems, test `AQ_DRM_DEVICES` ordering; `AQ_NO_MODIFIERS=1` can help with a blank external monitor.
- **No input:** check `hyprctl devices`, `libinput debug-events --show-keycodes`, user groups and the `input` config. A keyboard layout typo can look like dead input.
- **Display manager fails:** `journalctl -u sddm` or `journalctl -u greetd`; verify `/usr/share/wayland-sessions/hyprland.desktop`; test `dbus-run-session start-hyprland` from a TTY.
- **Audio missing:** `systemctl --user status pipewire wireplumber`; check the default sink with `wpctl`.
- **Network missing:** `systemctl status NetworkManager`; `nmcli device status`.
- **Portal or screen share fails:** both portal units, a single backend, `grim -l 1`, then the client.
- **Duplicate bar/notifications/tray:** one shell, one notification server, one SNI host.
- **Config error:** `Hyprland --verify-config`, `hyprctl configerrors`, `hyprctl repl`, `hyprctl reload full-reset`.

Deeper symptom playbooks: skill `hyprland-live-debug` and its `references/playbooks.md`.

## 10. Maintenance and upgrades

- Upgrade the whole system with `sudo pacman -Syu`; avoid partial upgrades. Hyprland and its libraries (aquamarine, hyprutils, hyprgraphics, hyprcursor) must come from the same rebuild.
- Back up `~/.config/hypr` before major changes; keep the config in git if possible.
- On every upgrade, check `hyprctl version`, `hyprctl configerrors` and the session log.
- Plugins must match the exact Hyprland ABI; after an update run `hyprpm update`, disable plugins when bisecting.
- If the config is still `hyprland.conf`, migrate to `hyprland.lua`; see skill `hyprland-lua` and its `references/hl-api.md`.
- Read `docs/state-of-world-2026.md` for version changes and knowledge traps.
- Keep Quickshell and its Qt runtime current; reinstall `quickshell-git` after Qt upgrades.

## 11. What this guide does not cover

- Installing the Arch base, partitioning, bootloader and users: use `archinstall` or the Arch installation guide.
- Hardware-specific quirks beyond the common GPU paths: use the ArchWiki, the Hyprland wiki and skill `hyprland-live-debug`.
- A full desktop shell implementation: use skill `quickshell` and the Hyprland QML agent.
