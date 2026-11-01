# Config options catalog (Lua-only era, 0.57; dotted paths; defaults shown)

Format: `path (type, default)` with ranges only where they matter. Source of truth: Hyprland **v0.57.0** `src/config/values/ConfigValues.cpp` (checked 2026-11-01) and wiki.hypr.land config-options. Not exhaustive — verify edge options on the wiki. **0.57 rejects out-of-range values as config errors.**

## 0.57 delta (read this first)

New: `layers.*` · `decoration.blur.variant` + `decoration.blur.proportional` + per-variant groups · `decoration.wobble.*` · `cursor.warp_on_monitor_change` · `input.swallow_focus_click` · `input.tablet.enabled` · `misc.bell_sound` · `misc.new_float_force_onscreen` · `misc.float_force_onscreen` · `binds.drag_center_window` · `binds.client_requested_fs_uses_layout_handler` · `render.async_commit` · `render.not_shown_fifo_lock` · `debug.invalidate_buffers` · `quirks.skip_non_kms_dmabuf_formats` · groupbar `indicator_height`/`rounding`/`rounding_power`/`gradient_rounding`/`gradient_rounding_power`.

Changed ranges: `decoration.rounding` max 100 (was 20) · `decoration.rounding_power` min 1 · `decoration.shadow.scale` 0.05..2 · `input.scroll_factor` / `input.touchpad.scroll_factor` max 100 · `binds.workspace_back_and_forth` int 0..2 (was bool) · `misc.exit_window_retains_fullscreen` int 0..3 (was bool) · `scrolling.follow_focus` int · `group.groupbar` rounding maxima raised.

Deprecated/moved: `misc.layers_hog_keyboard_focus` → `layers.layers_hog_keyboard_focus` · `dwindle.special_scale_factor` and `master.special_scale_factor` (use workspace rules) · `debug.invalidate_fp16` (use `debug.invalidate_buffers`).
Removed: `debug.fifo_pending_workaround`; the entire hyprlang config provider.

## general
`gaps_in (css_gaps, 5)` · `gaps_out (css_gaps, 20)` · `float_gaps (css_gaps, 0)` · `gaps_workspaces (int, 0)` · `border_size (int, 1, 0-20)` · `extend_border_grab_area (15, 0-100)` · `hover_icon_on_border (true)` · `resize_on_border (false)` · `resize_corner (0-4)` · `layout ("dwindle")` · `no_focus_fallback (false)` · `modal_parent_blocking (true)` · `allow_tearing (false)` · `locale`
`general.col`: `active_border (0xffffffff)` · `inactive_border (0xff444444)` · `nogroup_border (0xffffaaff)` · `nogroup_border_active (0xffff00ff)`
`general.snap`: `enabled (false)` · `border_overlap` · `respect_gaps` · `monitor_gap (10, 0-100)` · `window_gap (10, 0-100)`

## decoration
`rounding (int, 0, 0-100)` · `rounding_power (2.0, 1-10)` · `active_opacity (1.0)` · `inactive_opacity (1.0)` · `fullscreen_opacity (1.0)` · `dim_inactive (false)` · `dim_strength (0.5)` · `dim_around (0.4)` · `dim_special (0.2)` · `dim_modal (true)` · `screen_shader` · `border_part_of_window (true)`
`decoration.shadow`: `enabled (true)` · `color (0xee1a1a1a)` · `color_inactive` · `offset ({0,0})` · `range (4, 0-100)` · `render_power (3, 1-4)` · `scale (1.0, 0.05-2)` · `sharp (false)`
`decoration.glow`: `enabled (false)` · `color` · `range (10, 0-100)` · `render_power (3, 1-4)`
`decoration.motion_blur`: `enabled (false)` · `samples (7)`
`decoration.wobble`: `enabled (false)` · `mesh (12, 2-32)` · `stiffness (200, 0.0001-1000)` · `damping (12, 0-1000)` · `mass (1, 0.0001-1000)` · `intensity (0.2, 0-2)` · `value_epsilon (0.25, 0-100)` · `velocity_epsilon (2, 0-1000)`
`decoration.blur`: `enabled (true)` · `size (8, 0-100)` · `passes (1, 0-10)` · `new_optimizations (true)` · `ignore_opacity (true)` · `input_methods (false)` · `input_methods_ignorealpha (0.2)` · `noise (0.0117, 0-1)` · `contrast (0.8916, 0-2)` · `brightness (1.0, 0-2)` · `vibrancy (0.1696, 0-1)` · `vibrancy_darkness (0, 0-1)` · `xray (false)` · `popups (false)` · `popups_ignorealpha (0.2)` · `special (false)` · `variant (0/"kawase", 0-10)` · `proportional (false)`

### Blur variants (`decoration.blur.variant`)
Indices: `kawase` 0 (default), `frost` 1, `ripple` 2, `drops` 3, `water` 4, `fluid_jar` 5, `prism` 6, `heat_shimmer` 7, `acrylic` 8, `aurora` 9, `haze` 10. Variants may be animated and are GPU/CPU-expensive. `frost` and `prism` have no dedicated options.

- `glass` (shared by glass-style variants): `refraction` (20, 0-20) · `size` (40, 4-512) · `roughness` (1, 0-1)
- `acrylic`: `refraction` (24, 0-48) · `bulb` (48, 4-256) · `clarity` (0.82, 0-1) · `aberration` (0.025, 0-0.25) · `tint` (0x14EEF5FF; alpha = absorption)
- `drops`: `speed` (3, 0-10; 0 freezes)
- `heat_shimmer`: `speed` (1, 0-10)
- `aurora`: `speed` (1, 0-10) · `intensity` (0.35, 0-1) · `color1` (0x29F0A0FF) · `color2` (0x7A4DFFFF)
- `haze`: `intensity` (0.35, 0-1) · `iridescence` (0.7, 0-1)
- `ripple`: `strength` (30, 0-32) · `radius` (400, 1-1000) · `width` (32, 1-200) · `duration` (0.45, 0.05-5 s)
- `water`: `strength` (32, 0-32) · `radius` (20, 1-1000) · `speed` (0.76, 0-10) · `damping` (0.95, 0-1) · `duration` (12, 0.5-60 s)
- `fluid_jar`: `color` (0xCC3399FF) · `speed` (3.7, 0-10) · `fill_amount` (0.5, 0-1) · `mass` (1.4, 0.1-10) · `precision` (2, 0.5-8; 2x is the sane default) · `turbulence` (1.2, 0-5) · `distortion` (8, 0-10)

## animations
`enabled (true)` · `workspace_wraparound (false)` — leaf tree in `rules-animations.md` (windows*, fade*, border, borderangle, shadowangle, glowangle, workspaces, specialWorkspace, layers*, zoomFactor, monitorAdded...)

## layers (0.57 category)
`allow_new_top_layers_over_existing_fullscreen (true; false keeps new top layers under an already-covering fullscreen window)`
`layers_hog_keyboard_focus (true; replaces the deprecated misc key)`

## input (top)
`kb_layout ("us")` · `kb_variant` · `kb_model` · `kb_options` · `kb_rules` · `kb_file` · `repeat_rate (25)` · `repeat_delay (600)` · `numlock_by_default (false)` · `resolve_binds_by_sym (false)` · `follow_mouse (1, 0-3)` · `follow_mouse_shrink (0)` · `follow_mouse_threshold (0.0)` · `mouse_refocus (true)` · `focus_on_close (0, 0/1/2)` · `float_switch_override_focus (1)` · `special_fallthrough (false)` · `sensitivity (0.0, -1..1)` · `accel_profile` · `force_no_accel (false)` · `natural_scroll (false)` · `left_handed (false)` · `scroll_method` · `scroll_button (0)` · `scroll_button_lock` · `scroll_factor (1.0, 0-100)` · `scroll_points` · `emulate_discrete_scroll (1)` · `off_window_axis_events (1, 0-3)` · `rotation (0)` · `swallow_focus_click (false)` · `tablet.enabled (true)`
`input.touchpad`: `tap_to_click (true)` · `tap_and_drag (true)` · `tap_button_map (lrm/lmr)` · `natural_scroll (false)` · `disable_while_typing (true)` · `clickfinger_behavior (false)` · `middle_button_emulation (false)` · `drag_lock (0)` · `drag_3fg (0)` · `flip_x/y (false)` · `scroll_factor (1.0, 0-100)`
`input.touchdevice`: `enabled (true)` · `output (Auto)` · `transform (0, 0-6)`
`input.tablet`: `enabled (true)` · `output` · `transform (0, 0-6)` · `region_position/size` · `absolute_region_position` · `active_area_position/size` · `relative_input` · `left_handed`
`input.virtualkeyboard`: `share_states (2)` · `release_pressed_on_close`
`input.tablettool`: `eraser_button_mode` · `eraser_button_override` · `pressure_range_min/max`

## gestures
`workspace_swipe_distance (300)` · `workspace_swipe_touch (false)` · `workspace_swipe_invert (true)` · `workspace_swipe_touch_invert (false)` · `workspace_swipe_min_speed_to_force (30)` · `workspace_swipe_cancel_ratio (0.5)` · `workspace_swipe_create_new (true)` · `workspace_swipe_direction_lock (true)` · `workspace_swipe_direction_lock_threshold (10)` · `workspace_swipe_forever (false)` · `workspace_swipe_use_r (false)` · `close_max_timeout (1000)`
`gestures.scrolling`: `move_snap_to_grid (true)` · `move_snap_cursor (true)`

## group
`auto_group (true)` · `insert_after_current (true)` · `focus_removed_window (true)` · `drag_into_group (1)` · `merge_groups_on_drag (true)` · `merge_groups_on_groupbar (true)` · `merge_floated_into_tiled_on_groupbar (false)` · `group_on_movetoworkspace (false)`
`group.col`: `border_active (0x66ffff00)` · `border_inactive (0x66777700)` · `border_locked_active (0x66ff5500)` · `border_locked_inactive (0x66775500)`
`group.groupbar`: `enabled (true)` · `height (14)` · `gaps_in (2)` · `gaps_out (2)` · `rounding (1, 0-40)` · `rounding_power (2, 1-10)` · `round_only_edges (true)` · `gradients (false)` · `gradient_rounding (2, 0-40)` · `gradient_round_only_edges (true)` · `gradient_rounding_power (2, 1-10)` · `render_titles (true)` · `stacked (false)` · `scrolling (true)` · `font_family` · `font_size (8)` · `font_weight_active (normal)` · `font_weight_inactive (normal)` · `text_color (0xffffffff)` · `text_offset (0)` · `text_padding (0)` · `keep_upper_gap (true)` · `priority (3)` · `blur (false)` · `indicator_height (3, 0-64)` · `indicator_gap (0)` · `disable_when_only (false)` · `middle_click_close (true)`
`group.groupbar.col`: `active/inactive/locked_active/locked_inactive`

## misc
`font_family ("Sans")` · `background_color (0x111111)` · `force_default_wallpaper (-1)` · `disable_hyprland_logo (false)` · `disable_splash_rendering (false)` · `splash_font_family` · `misc.col.splash (0x55ffffff)` · `disable_autoreload (false)` · `vrr (0, 0-3; off/on/fullscreen/fullscreen_game)` · `enable_swallow (false)` · `swallow_regex` · `swallow_exception_regex` · `focus_on_activate (false)` · `on_focus_under_fullscreen (2, 0-2)` · `mouse_move_focuses_monitor (true)` · `mouse_move_enables_dpms (false)` · `key_press_enables_dpms (false)` · `always_follow_on_dnd (true)` · `animate_mouse_windowdragging (false)` · `animate_manual_resizes (false)` · `middle_click_paste (true)` · `exit_window_retains_fullscreen (0, 0-3)` · `float_force_onscreen (0)` · `new_float_force_onscreen (2)` · `size_limits_tiled (false)` · `render_unfocused_fps (15, 1-120)` · `initial_workspace_tracking (1, 0-2)` · `initial_workspace_token_timeout (10, 1-3600)` · `name_vk_after_proc (true)` · `disable_xdg_env_checks (false)` · `disable_hyprland_guiutils_check (false)` (renamed from `_qtutils_check` in 0.52) · `disable_scale_notification (false)` · `disable_watchdog_warning (false)` · `enable_anr_dialog (true)` · `anr_missed_pings (5, 1-20)` · `lockdead_screen_delay (1000, 0-5000)` · `allow_session_lock_restore (false)` · `session_lock_blur (false)` · `session_lock_xray (false)` · `screencopy_force_8b (true)` · `close_special_on_empty (true)` · `bell_sound ("default"; `none`/empty mutes)` · `layers_hog_keyboard_focus` is DEPRECATED here → use `layers.layers_hog_keyboard_focus`
`layout`: `single_window_aspect_ratio ({0,0})` · `single_window_aspect_ratio_tolerance (0.1)`

## binds
`workspace_back_and_forth (0, 0-2)` · `allow_workspace_cycles (false)` · `hide_special_on_workspace_change (false)` · `workspace_center_on (1)` · `focus_preferred_method (0)` · `ignore_group_lock (false)` · `movefocus_cycles_fullscreen (false)` · `movefocus_cycles_groupfirst (false)` · `disable_keybind_grabbing (false)` · `allow_pin_fullscreen (false)` · `pass_mouse_when_bound (false)` · `scroll_event_delay (300)` · `drag_threshold (0)` · `window_direction_monitor_fallback (true)` · `drag_center_window (true)` · `client_requested_fs_uses_layout_handler (true)`

## xwayland / opengl / render / cursor / ecosystem / quirks / debug / experimental
`xwayland`: `enabled (true)` · `create_abstract_socket (false)` · `force_zero_scaling (false)` · `use_nearest_neighbor (true)`
`opengl`: `nvidia_anti_flicker (true)`
`render`: `direct_scanout (0)` · `expand_undersized_textures (true)` · `new_render_scheduling (false)` · `commit_timing_enabled (true)` · `async_commit (false)` · `xp_mode (false)` · `send_content_type (true)` · `cm_enabled (true)` · `cm_auto_hdr (1, 0-2)` · `cm_sdr_eotf ("default")` · `non_shader_cm (2, 0-3)` · `non_shader_cm_interop (2)` · `use_fp16 (2)` · `fp16_sdr_tf (0)` · `ctm_animation (2)` · `icc_vcgt_enabled (true)` · `keep_unmodified_copy (2)` · `use_shader_blur_blend (false)` · `not_shown_fifo_lock (0, 0-2)` (cm_fs_passthrough REMOVED 0.55)
`cursor`: `no_warps (false)` · `persistent_warps (false)` · `warp_back_after_non_mouse_input (false)` · `warp_on_change_workspace (0)` · `warp_on_monitor_change (-1, -1..2)` · `warp_on_toggle_special (0)` · `default_monitor` · `hide_on_key_press (false)` · `hide_on_touch (true)` · `hide_on_tablet (false)` · `inactive_timeout (0)` · `enable_hyprcursor (true)` · `sync_gsettings_theme (true)` · `no_hardware_cursors (2)` · `use_cpu_buffer (2)` · `min_refresh_rate (24)` · `hotspot_padding (0)` · `zoom_factor (1.0)` · `zoom_rigid` · `zoom_detached_camera (true)` · `zoom_disable_aa` · `invisible (false)` · `no_break_fs_vrr (2)`
`ecosystem`: `no_update_news (false)` · `no_donation_nag (false)` · `enforce_permissions (false)`
`quirks`: `prefer_hdr (0)` · `skip_non_kms_dmabuf_formats (true)`
`input-capture`: `capture_modifiers (false)` · `enforce_barriers (true)`
`debug`: `disable_logs (true)` · `enable_stdout_logs (false)` · `colored_stdout_logs (true)` · `damage_blink (false)` · `log_damage (false)` · `damage_tracking (2)` · `overlay (false)` · `pass (false)` · `gl_debugging (false)` · `invalidate_buffers (1, 0-1)` · `invalidate_fp16 (DEPRECATED)` · `render_solitary_wo_damage` · `vfr (true)` · `manual_crash (0)` · `suppress_errors (false)` · `error_limit (5)` · `error_position (0)` · `disable_scale_checks` · `disable_time (true)` · `full_cm_proto (false)` · `ds_handle_same_buffer (true)` · `ds_handle_same_buffer_fifo (true)` (`fifo_pending_workaround` REMOVED 0.57)
`experimental`: `wp_cm_1_2 (false)`

## Layout configs
`dwindle`: `force_split (0)` · `preserve_split (false)` · `smart_split (false)` · `smart_resizing (true)` · `permanent_direction_override (false)` · `special_scale_factor (1.0, DEPRECATED: use workspace rules)` · `split_width_multiplier (1.0)` · `use_active_for_splits (true)` · `default_split_ratio (1.0)` · `split_bias (0)` · `precise_mouse_move (false)` — pseudotile REMOVED 0.55 (per-window now)
`master`: `mfact (0.55, 0-1)` · `new_status ("slave")` · `new_on_top (false)` · `new_on_active ("none")` · `orientation ("left")` · `slave_count_for_center_master (2)` · `center_master_fallback ("left")` · `allow_small_split (false)` · `smart_resizing (true)` · `drop_at_cursor (true)` · `always_keep_position (false)` · `focus_master_on_close (false)` · `special_scale_factor (DEPRECATED: use workspace rules)`
`scrolling`: `column_width (0.5)` · `fullscreen_on_one_column (true)` · `focus_fit_method (1)` · `follow_focus (int)` · `follow_min_visible (0.4)` · `explicit_column_widths` · `wrap_focus (true)` · `wrap_swapcol (true)` · `direction ("right")`
`monocle`: (no options)
