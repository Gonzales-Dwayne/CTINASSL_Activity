# Hero 3D — performance notes

> **PARKED.** The hero currently runs the original, simple version of the model
> stage (full-quality GLBs from `src/lofree_flow_lineup/glb/`, environment
> lighting, no quality tiers, no lazy loading, no billboards). Everything below
> documents the optimisation pass that was built and then rolled back — keep it
> as a reference for picking this up again.

How the Lofree hero stage is built, what it costs, and how to profile it.

## Architecture

```
src/components/HeroShowcase.jsx   WebGL stage (three.js, no React re-renders per frame)
src/lofree_flow_lineup/glb/       original exports from the CAD lineup
src/lofree_flow_lineup/glb_opt/   decimated (≈54 % fewer triangles), generated
src/lofree_flow_lineup/glb_meshopt/ Meshopt-compressed GLB actually shipped (≈115 KB each)
public/models/lofree/slide-N.webp baked billboards used on phones / very weak GPUs
tools/simplify_glb.py             offline decimation
```

The scene is deliberately tiny: four single-object models, one visible at a time.

## What we do, and why

| Decision | Why | Cost |
| --- | --- | --- |
| Offline decimation (`glb_opt`) | 40k → 19k tris per keyboard with silhouette/legends intact | 0 at runtime |
| Meshopt geometry compression | 470 KB → ~115 KB per model, very fast decode (no wasm-heavy Draco) | decoder ~20 KB, negligible CPU |
| Lazy model loading + one-ahead prefetch | first paint needs **115 KB**, not the whole ~2 MB lineup | one extra request after idle |
| One model visible at a time | non-visible groups are skipped by three's frustum/visibility checks | trivial |
| Fake contact shadow quad | replaces a shadow map + shadow pass | 1 draw call, no extra render pass |
| Direct lights only | 1 ambient + 3 directionals; no shadow casters, no spot lights | cheap per-fragment |
| IBL is optional | image-based lighting is the most expensive fragment feature here | toggled by the quality ladder |
| Resolution stays native | blurry upscaling was the main "looks cheap" complaint | paid for by dropping IBL/fps first |
| Frame-rate cap (26 → 15 fps) | slow cinematic sway does not need 60 fps | halves/bounds GPU work |
| Pause when off-screen or tab hidden | no work while the user is elsewhere | 0 |
| Mobile = baked billboard, no WebGL | avoids three.js chunk + GLB + a second GPU context on phones | 15–17 KB WebP per slide |

## Measured numbers (headless Chromium, SwiftShader — a worst-case software rasterizer)

| Metric | Before | After |
| --- | --- | --- |
| Main-thread rAF | 16 fps | ~50 fps |
| Long tasks (3 s window) | 45, 2.8 s blocking | 0 |
| Canvas | 914 × 908 | 914 × 908 (native, sharp) |
| Draw calls | 16 | 15–16 (two models only while cross-fading) |
| Triangles | 19k–22k | 19k–22k single, 40k during cross-fade |
| Initial model payload | 4 × ~1.86 MB | **115 KB**, then prefetch |

Desktop stats are exposed in development on `window.__heroStats`
(`calls`, `triangles`, `quality`, `env`, `scale`, `dpr`, `loaded`).

## Quality ladder

Automatic mode samples frame times (45-frame warm-up, then 45-frame windows) and
steps down only when the average frame is slower than 46 ms:

1. `26 fps` — IBL on (reflections, best look)
2. `26 fps` — IBL off
3. `20 fps` — IBL off
4. `15 fps` — IBL off
5. `15 fps` — 0.85 render scale (last resort)

Manual presets (button, bottom-right of the hero) pin a tier and persist in
`localStorage` under `clacklabs.quality`: **Auto / High / Low**.

## Known limitations

- The models are simplified exports; legends are geometry, so extremely close
  inspection shows faceting on curved keycaps.
- IBL is dropped on weak GPUs, so metal looks flatter (direct specular only).
- Billboards are static per slide — mobile gets no motion, by design.
- No Draco; Meshopt is faster to decode and needs no extra worker.

## How to test / profile

```powershell
npm run dev
```

1. Open DevTools → Performance, record 10 s while the hero animates; check for
   long tasks and dropped frames.
2. `window.__heroStats` in the console shows draw calls, triangles, active tier.
3. Throttle: DevTools → Performance → CPU 6× (emulates weak hardware) and watch
   the tier drop; the image must stay sharp.
4. Network: DevTools → Network, filter `glb`; first load should show a single
   ~115 KB request, then a prefetch after ~1.4 s.
5. Mobile: resize below 900 px (or device emulation) — expect **zero** WebGL
   contexts, zero GLB requests, and the per-slide WebP billboard.
