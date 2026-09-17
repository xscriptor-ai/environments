# Config options catalog (Lua era, 0.55+/0.56, dotted paths; defaults shown)

Format: `path (type, default)`. Source: wiki.hypr.land config-options (Latest git / 0.56.0). Not exhaustive — verify edge options on the wiki.

## general
`gaps_in (css_gaps, 5)` · `gaps_out (css_gaps, 20)` · `float_gaps (css_gaps, 0)` · `gaps_workspaces (int, 0)` · `border_size (int, 1)` · `extend_border_grab_area (15)` · `hover_icon_on_border (true)` · `resize_on_border (false)` · `resize_corner (0-4)` · `layout ("dwindle")` · `no_focus_fallback (false)` · `modal_parent_blocking (true)` · `allow_tearing (false)` · `locale`
`general.col`: `active_border (0xffffffff)` · `inactive_border (0xff444444)` · `nogroup_border (0xffffaaff)` · `nogroup_border_active (0xffff00ff)`
`general.snap`: `enabled (false)` · `border_overlap` · `respect_gaps` · `monitor_gap (10)` · `window_gap (10)`

## decoration
`rounding (0)` · `rounding_power (2.0)` · `active_opacity (1.0)` · `inactive_opacity (1.0)` · `fullscreen_opacity (1.0)` · `dim_inactive (false)` · `dim_strength (0.5)` · `dim_around (0.4)` · `dim_special (0.2)` · `dim_modal (true)` · `screen_shader` · `border_part_of_window (true)`
`decoration.shadow`: `enabled (true)` · `color (0xee1a1a1a)` · `color_inactive` · `offset ({0,0})` · `range (4)` · `render_power (3)` · `scale (1.0)` · `sharp (false)`
`decoration.glow`: `enabled (false)` · `color` · `range (10)` · `render_power (3)`
`decoration.motion_blur`: `enabled (false)` · `samples (7)`
`decoration.wobble`: `enabled (false)` · `mesh (12)` · `stiffness (200)` · `damping (12)` · `mass (1)` · `intensity (0.2)`
`decoration.blur`: `enabled (true)` · `size (8)` · `passes (1)` · `new_optimizations (true)` · `ignore_opacity (true)` · `noise (0.0117)` · `contrast (0.8916)` · `brightness (1.0)` · `vibrancy (0.1696)` · `vibrancy_darkness (0)` · `xray (false)` · `popups (false)` · `popups_ignorealpha (0.2)` · `special (false)` · `variant ("kawase")` — variants: kawase acrylic aurora drops fluid_jar frost haze heat_shimmer prism ripple water (each with own sub-options; shared `glass` group for aurora/drops/heat_shimmer/prism: refraction/roughness/size)

## animations
`enabled (true)` · `workspace_wraparound (false)` — leaf tree in SKILL/agents (windows*, fade*, border, borderangle, shadowangle, glowangle, workspaces, specialWorkspace, layers*, zoomFactor, monitorAdded...)

## input (top)
`kb_layout ("us")` · `kb_variant` · `kb_model` · `kb_options` · `kb_rules` · `kb_file` · `repeat_rate (25)` · `repeat_delay (600)` · `numlock_by_default (false)` · `resolve_binds_by_sym (false)` · `follow_mouse (1, 0-3)` · `follow_mouse_shrink (0)` · `follow_mouse_threshold (0.0)` · `mouse_refocus (true)` · `focus_on_close (0, 0/1/2)` · `float_switch_override_focus (1)` · `special_fallthrough (false)` · `sensitivity (0.0)` · `accel_profile` · `force_no_accel (false)` · `natural_scroll (false)` · `left_handed (false)` · `scroll_method` · `scroll_button (0)` · `scroll_button_lock` · `scroll_factor (1.0)` · `scroll_points` · `emulate_discrete_scroll (1)` · `off_window_axis_events (1)` · `rotation (0)`
`input.touchpad`: `tap_to_click (true)` · `tap_and_drag (true)` · `tap_button_map (lrm/lmr)` · `natural_scroll (false)` · `disable_while_typing (true)` · `clickfinger_behavior (false)` · `middle_button_emulation (false)` · `drag_lock (0)` · `drag_3fg (0)` · `flip_x/y (false)` · `scroll_factor (1.0)`
`input.touchdevice`: `enabled (true)` · `output (Auto)` · `transform (0)`
`input.tablet`: `output` · `transform (0)` · `region_position/size` · `absolute_region_position` · `active_area_position/size` · `relative_input` · `left_handed`
`input.virtualkeyboard`: `share_states (2)` · `release_pressed_on_close`
`input.tablettool`: `eraser_button_mode` · `eraser_button_override` · `pressure_range_min/max`

## gestures
`workspace_swipe_distance (300)` · `workspace_swipe_touch (false)` · `workspace_swipe_invert (true)` · `workspace_swipe_touch_invert (false)` · `workspace_swipe_min_speed_to_force (30)` · `workspace_swipe_cancel_ratio (0.5)` · `workspace_swipe_create_new (true)` · `workspace_swipe_direction_lock (true)` · `workspace_swipe_direction_lock_threshold (10)` · `workspace_swipe_forever (false)` · `workspace_swipe_use_r (false)` · `close_max_timeout (1000)`
`gestures.scrolling`: `move_snap_to_grid (true)` · `move_snap_cursor (true)`

## group
`auto_group (true)` · `insert_after_current (true)` · `focus_removed_window (true)` · `drag_into_group (1)` · `merge_groups_on_drag (true)` · `merge_groups_on_groupbar (true)` · `merge_floated_into_tiled_on_groupbar (false)` · `group_on_movetoworkspace (false)`
`group.col`: `border_active (0x66ffff00)` · `border_inactive (0x66777700)` · `border_locked_active (0x66ff5500)` · `border_locked_inactive (0x66775500)`
`group.groupbar`: `enabled (true)` · `height (14)` · `gaps_in (2)` · `gaps_out (2)` · `rounding (1)` · `rounding_power` · `round_only_edges (true)` · `gradients (false)` · `gradient_rounding (2)` · `gradient_round_only_edges (true)` · `render_titles (true)` · `stacked (false)` · `scrolling (true)` · `font_family` · `font_size (8)` · `text_color (0xffffffff)` · `text_offset (0)` · `text_padding (0)` · `priority (3)` · `blur (false)` · `indicator_height (3)` · `indicator_gap (0)` · `disable_when_only (false)` (0.56) · `middle_click_close (true)` (0.56)
`group.groupbar.col`: `active/inactive/locked_active/locked_inactive`

## misc
`font_family ("Sans")` · `background_color (0x111111)` · `force_default_wallpaper (-1)` · `disable_hyprland_logo (false)` · `disable_splash_rendering (false)` · `splash_font_family` · `misc.col.splash (0x55ffffff)` · `disable_autoreload (false)` · `vrr (0, 0-3)` → moved: `debug.vfr` (0.55+) · `enable_swallow (false)` · `swallow_regex` · `swallow_exception_regex` · `focus_on_activate (false)` · `focus_on_under_fullscreen? -> on_focus_under_fullscreen (2, 0-2)` · `mouse_move_focuses_monitor (true)` · `mouse_move_enables_dpms (false)` · `key_press_enables_dpms (false)` · `layers_hog_keyboard_focus (true)` · `always_follow_on_dnd (true)` · `animate_mouse_windowdragging (false)` · `animate_manual_resizes (false)` · `middle_click_paste (true)` · `exit_window_retains_fullscreen (0, 0-3)` · `float_force_onscreen (0)` · `new_float_force_onscreen (2)` · `size_limits_tiled (false)` · `render_unfocused_fps (15)` · `initial_workspace_tracking (1)` · `initial_workspace_token_timeout (10)` · `name_vk_after_proc (true)` · `disable_xdg_env_checks (false)` · `disable_hyprland_guiutils_check (false)` (renamed from `_qtutils_check` in 0.52) · `disable_scale_notification (false)` · `disable_watchdog_warning (false)` · `enable_anr_dialog (true)` · `anr_missed_pings (5)` · `lockdead_screen_delay (1000)` · `allow_session_lock_restore (false)` · `session_lock_blur (false)` · `session_lock_xray (false)` · `screencopy_force_8b (true)` · `close_special_on_empty (true)` · `bell_sound ("default")` · `xwayland? no — separate section`
`layout`: `single_window_aspect_ratio ({0,0})` · `single_window_aspect_ratio_tolerance (0.1)`

## binds
`workspace_back_and_forth (false)` · `allow_workspace_cycles (false)` · `hide_special_on_workspace_change (false)` · `workspace_center_on (1)` · `focus_preferred_method (0)` · `ignore_group_lock (false)` · `movefocus_cycles_fullscreen (false)` · `movefocus_cycles_groupfirst (false)` · `disable_keybind_grabbing (false)` · `allow_pin_fullscreen (false)` · `pass_mouse_when_bound (false)` · `scroll_event_delay (300)` · `drag_threshold (0)` · `window_direction_monitor_fallback (true)`

## xwayland / opengl / render / cursor / ecosystem / quirks / debug / experimental
`xwayland`: `enabled (true)` · `create_abstract_socket (false)` · `force_zero_scaling (false)` · `use_nearest_neighbor (true)`
`opengl`: `nvidia_anti_flicker (true)`
`render`: `direct_scanout (0)` · `expand_undersized_textures (true)` · `new_render_scheduling (false)` · `commit_timing_enabled (true)` · `async_commit (false)` · `xp_mode (false)` · `send_content_type (true)` · `cm_enabled (true)` · `cm_auto_hdr (1, 0-2)` · `cm_sdr_eotf ("default")` · `non_shader_cm (2, 0-3)` · `non_shader_cm_interop (2)` · `use_fp16 (2)` · `fp16_sdr_tf (0)` · `ctm_animation (2)` · `icc_vcgt_enabled (true)` · `keep_unmodified_copy (2)` · `use_shader_blur_blend (false)` · `not_shown_fifo_lock (0)` (cm_fs_passthrough REMOVED 0.55)
`cursor`: `no_warps (false)` · `persistent_warps (false)` · `warp_back_after_non_mouse_input (false)` · `warp_on_change_workspace (0)` · `warp_on_monitor_change (-1)` · `warp_on_toggle_special (0)` · `default_monitor` · `hide_on_key_press (false)` · `hide_on_touch (true)` · `hide_on_tablet (false)` · `inactive_timeout (0)` · `enable_hyprcursor (true)` · `sync_gsettings_theme (true)` · `no_hardware_cursors (2)` · `use_cpu_buffer (2)` · `min_refresh_rate (24)` · `hotspot_padding (0)` · `zoom_factor (1.0)` · `zoom_rigid` · `zoom_detached_camera (true)` · `zoom_disable_aa` · `invisible (false)` · `no_break_fs_vrr (2)`
`ecosystem`: `no_update_news (false)` · `no_donation_nag (false)` · `enforce_permissions (false)`
`quirks`: `prefer_hdr (0)` · `skip_non_kms_dmabuf_formats (false)`
`input-capture`: `capture_modifiers (false)` · `enforce_barriers (true)`
`debug`: `disable_logs (true)` · `enable_stdout_logs (false)` · `colored_stdout_logs (true)` · `damage_blink (false)` · `log_damage (false)` · `damage_tracking (2)` · `overlay (false)` · `pass (false)` · `gl_debugging (false)` · `invalidate_buffers (1)` · `render_solitary_wo_damage` · `vfr (true)` (moved from misc in 0.55) · `manual_crash (0)` · `suppress_errors (false)` · `error_limit (5)` · `error_position (0)` · `disable_scale_checks` · `disable_time (true)` · `full_cm_proto (false)` · `fifo_pending_workaround` · `ds_handle_same_buffer (true)` · `ds_handle_same_buffer_fifo (true)`
`experimental`: `wp_cm_1_2 (false)`

## Layout configs
`dwindle`: `force_split (0)` · `preserve_split (false)` · `smart_split (false)` · `smart_resizing (true)` · `permanent_direction_override (false)` · `special_scale_factor (1.0)` · `split_width_multiplier (1.0)` · `use_active_for_splits (true)` · `default_split_ratio (1.0)` · `split_bias (0)` · `precise_mouse_move (false)` — pseudotile REMOVED 0.55 (per-window now)
`master`: `mfact (0.55)` · `new_status ("slave")` · `new_on_top (false)` · `new_on_active ("none")` · `orientation ("left")` · `slave_count_for_center_master (2)` · `center_master_fallback ("left")` (renamed 0.49) · `allow_small_split (false)` · `smart_resizing (true)` · `drop_at_cursor (true)` · `always_keep_position (false)` · `focus_master_on_close (false)` · `special_scale_factor`
`scrolling`: `column_width (0.5)` · `fullscreen_on_one_column (true)` · `focus_fit_method (1)` · `follow_focus (true)` · `follow_min_visible (0.4)` · `explicit_column_widths` · `wrap_focus (true)` · `wrap_swapcol (true)` · `direction ("right")`
`monocle`: (no options)
