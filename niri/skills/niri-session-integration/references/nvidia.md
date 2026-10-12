# NVIDIA on niri

Documented niri-specific NVIDIA caveats and workarounds. Baseline: niri 26.04
(2026-04-25).

## High VRAM usage fix (heap reuse quirk)

There is a quirk in the NVIDIA drivers where the driver does not properly
release VRAM back into the pool. niri should use on the order of **100 MiB** of
VRAM (check with `nvtop`); approaching **1 GiB** means you are likely hitting
this issue (the heap is not returning freed buffers to the driver).

Mitigate it with a per-process NVIDIA application profile:

1. Create the config directory if it does not exist:

   ```sh
   sudo mkdir -p /etc/nvidia/nvidia-application-profiles-rc.d
   ```

2. Write the following file. The name can be anything and does not need an
   extension; this example uses the conventional name:

   ```
   /etc/nvidia/nvidia-application-profiles-rc.d/50-limit-free-buffer-pool-in-wayland-compositors.json
   ```

   ```json
   {
       "rules": [
           {
               "pattern": {
                   "feature": "procname",
                   "matches": "niri"
               },
               "profile": "Limit Free Buffer Pool On Wayland Compositors"
           }
       ],
       "profiles": [
           {
               "name": "Limit Free Buffer Pool On Wayland Compositors",
               "settings": [
                   {
                       "key": "GLVidHeapReuseRatio",
                       "value": 0
                   }
               ]
           }
       ]
   }
   ```

3. Restart niri to apply the change.

The shipped NVIDIA fix uses `GLVidHeapReuseRatio` value `0`; an earlier config
from an NVIDIA engineer used `1`. The upstream discussion is
[NVIDIA/egl-wayland#126](https://github.com/NVIDIA/egl-wayland/issues/126#issuecomment-2379945259).

## Black screen troubleshooting

NVIDIA GPUs can have problems running niri, for example the screen remaining
black when starting from a TTY. Try:

1. Update the NVIDIA drivers. You need a GPU and drivers recent enough to
   support **GBM**.
2. Make sure kernel modesetting is enabled. This usually means adding
   `nvidia-drm.modeset=1` to the kernel command line. Follow a guide for your
   distribution; guides from other Wayland compositors also apply.

If the render device is still misdetected, pin the GPU explicitly:

```kdl
debug {
    render-drm-device "/dev/dri/renderD128"
}
```

See `niri-configuration` for the full `debug {}` option set.

## Screencast flickering fix (historical)

<sup>Until: 25.08</sup>

On NVIDIA, screencast glitches or flickering could be worked around with:

```kdl
debug {
    wait-for-frame-completion-in-pipewire
}
```

This flag has since been **removed**; the underlying problem was fixed in niri,
so on 26.04 it is not needed and will fail to parse.

## Mixed Intel + NVIDIA: 10-bit output

On some Intel + NVIDIA mixed-GPU setups, requesting a 10-bit color format can
leave the screen dark or displaying only white. Until this is fixed in Smithay,
disable 10-bit output:

```kdl
debug {
    disable-10bit-output
}
```

## Related

- `nvidia.md` in this skill covers niri-specific quirks. General driver setup
  (kernel modesetting, `nvidia-drm.modeset=1`) is distribution territory.
- Hybrid-GPU external-monitor lag is covered in the `niri-troubleshooting`
  skill's `references/faq.md`.
