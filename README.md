# Xscriptor Environments

Environment packs for AI coding assistants: agents, skills, commands, and docs for desktop environments.

Each environment is a self-contained folder with its own `README.md` index.

## Environments

| Environment | Content |
|---|---|
| [hyprland](hyprland/) | Hyprland v0.56.x (Lua config era): 12 specialized agents, 3 deep-reference skills, 2 commands, and a September 2026 state-of-the-world dossier. |
| [niri](niri/) | niri 26.04 (KDL config) plus the Hyprland to niri migration layer: 10 specialized agents and 15 deep-reference skills (niri core and config/IPC/tooling mapping). |
| [archiso](archiso/) | Arch-based distro building (October 2026, archiso 91, pacman 7.1, mkinitcpio 42, Calamares 3.4.3, archinstall 4.5) plus the X Linux (xlnux) project layer: 19 specialized agents, 6 deep-reference skills, 6 commands, and state-of-the-world + distro blueprint + sources + xlnux project map dossiers. |
| [design-arsenal](design-arsenal/) | Design arsenal (October 2026): image pipeline (ImageMagick, libvips, FFmpeg, Real-ESRGAN), mobile→desktop wallpaper craft, 118 palettes, 32 SVG gradients, 13 patterns, 7 safe-zone guides, 6 agents, 6 deep-reference skills, 4 commands, 16 full guides, 12 resource catalogs, licensing and provenance. |

## Adding an environment

1. Create a folder at the root, e.g. `my-env/`.
2. Include a `README.md` that indexes the environment and links its documents.
3. Add a row to the table above.
4. Keep each pack self-contained: relative internal links and cited sources.

## License

MIT
