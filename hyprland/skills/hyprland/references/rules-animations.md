# Rules & animations catalog (0.53+ rules syntax, Lua era)

## hl.window_rule match props
`class` `title` `initial_class` `initial_title` (RE2; `negative:` prefix) · `content` (none/photo/video/game) · `focus` · `fullscreen` · `fullscreen_state_client/internal` (0 none, 1 maximize, 2 fullscreen, 3 both) · `float` · `group` · `modal` · `pin` · `tag` (code / code*) · `workspace` (id/name:/selector) · `xdg_tag` (regex) · `xwayland`

## Static effects (at open)
`center` · `content` · `float` · `fullscreen` · `fullscreen_state ("1 2")` · `group` (set [always] / new / lock [always] / barred / deny / invade / override / unset) · `maximize` · `monitor` (+ "silent") · `move` (expr) · `no_close_for` (ms) · `no_initial_focus` · `pin` · `pseudo` · `scrolling_width` · `size` (expr) · `suppress_event` ("fullscreen maximize activate activatefocus fullscreenoutput x11configurerequest") · `tile` · `workspace` (…, "unset", "silent")
move/size expr vars: `monitor_w/h window_x/y window_w/h cursor_x/y`, e.g. `move = {"cursor_x-(window_w*0.5)", "cursor_y-(window_h*0.5)"}`

## Dynamic effects (re-evaluated; also set_prop)
`persistent_size` · `no_max_size` · `stay_focused` · `animation ("popin 80%")` · `border_color` (gradient; pair w/ match focus true/false) · `idle_inhibit` (none/always/focus/fullscreen) · `opacity` ("0.9 0.7 0.5", + override) · `tag` (+name/-name/name) · `max_size`/`min_size` (vec2) · `border_size` · `rounding` · `rounding_power` · `allows_input` · `dim_around` · `decorate` · `focus_on_activate` · `keep_aspect_ratio` · `nearest_neighbor` · `no_anim` · `no_auto_hdr` · `no_blur` · `no_dim` · `no_focus` · `no_follow_mouse` · `no_shadow` · `no_glow` · `no_shortcuts_inhibit` · `no_screen_share` · `no_vrr` · `no_wobble` · `no_xdg_drags` · `opaque` · `force_rgbx` · `sync_fullscreen` · `tonemap` (on/off/clamp/limited) · `immediate` (tearing) · `xray` · `render_unfocused` · `scroll_mouse`/`scroll_touchpad` (float) · `confine_pointer`
Evaluation: top-to-bottom, LAST match wins. Named rules: runtime toggle (`h:set_enabled(false)`).

## hl.workspace_rule keys
`workspace` (selector) · `monitor` · `default` · `persistent` · `default_name` · `layout` (dwindle/master/scrolling/monocle) · `layout_opts` (per-layout) · `on_created_empty` ("[float] cmd") · `animation` · `border_size` · `no_border` · `no_shadow` · `no_rounding` · `decorate` · `gaps_in/gaps_out/float_gaps`

## hl.layer_rule effects
`above_lock` (1 above / 2 above+interactive) · `animation` · `blur` · `blur_popups` · `dim_around` · `ignore_alpha` (float) · `no_anim` · `no_screen_share` · `order` (int ±) · `xray`
`blurls` keyword: gone (blur = decoration.blur.* + layer rules).

## Animation leaf tree
`global` → `windows` (slide/popin/gnomed) → `windowsIn` `windowsOut` `windowsMove`
`layers` (slide/popin/fade) → `layersIn` `layersOut`
`fade` → `fadeIn` `fadeOut` `fadeSwitch` `fadeShadow` `fadeGlow` `fadeDim` `fadeLayers(→In/Out)` `fadePopups(→In/Out)` `fadeDpms`
`border` · `borderangle` (once/loop) · `shadowangle` (once/loop) · `glowangle` (once/loop)
`workspaces` (slide/slidevert/fade/slidefade/slidefadevert) → `workspacesIn` `workspacesOut` `specialWorkspace(→In/Out)`
`zoomFactor` · `monitorAdded`
Styles: `popin 80%`, `slidefade 20%`, `slide left|right|top|bottom`; speed in deciseconds; springs (`type = "spring"`, critical damping `damping = 2*sqrt(k*m)`).

## Gesture actions (hl.gesture)
directions: swipe/horizontal/vertical/left/right/up/down/pinch/pinchin/pinchout · actions: lua fn | `{start,update,finish}` | workspace | move | resize | special(+workspace_name) | close | fullscreen(+mode) | float | cursor_zoom(+zoom_level, mode mult/live) | scroll_move | unset · fields: `mods`, `scale`, `disable_inhibit`
