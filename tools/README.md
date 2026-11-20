# Tools

## `step_to_glb.py`

Converts a STEP (AP203/AP214) CAD file into a GLB the hero carousel can render.
It uses OpenCASCADE's tessellator (`cadquery-ocp`), which handles SolidWorks
exports that a surface mesher refuses to mesh.

```powershell
# one-time deps (bundled Python)
python -m pip install cadquery-ocp trimesh numpy fast-simplification

python tools/step_to_glb.py "C:\path\to\model.STEP" public\models\b1-pro-bottom-case.glb --deflection 0.2
```

Output: centred at the origin, rotated Z-up → Y-up, scaled to ~1 unit, PBR
material applied, decimated to ≤120k triangles.

The storefront loads `public/models/b1-pro-bottom-case.glb` in the hero. If the
file is missing the hero silently falls back to the colour slides.

## Licensing note

The sample model is Keychron's B1 Pro bottom case from
[Keychron-Keyboards-Hardware-Design](https://github.com/Keychron/Keychron-Keyboards-Hardware-Design),
used for educational, non-commercial purposes under the
**Keychron Source-Available License**. The converted `.glb` is git-ignored on
purpose: that license does not allow redistributing modified versions of the
files. Generate it locally from the STEP file you downloaded yourself.

## Status (pinned)

The 3D hero is **switched off** for now. It ships behind a flag in
`src/LandingPage.jsx`:

```js
const HERO_MODEL_ENABLED = false
```

Set it to `true` (and make sure `public/models/b1-pro-bottom-case.glb` exists)
to bring the model back; the hero otherwise shows the five colour slides with
the timer and progress dots. The converted GLB is git-ignored, so a fresh clone
needs to regenerate it with the command above.
