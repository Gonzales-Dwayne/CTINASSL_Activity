# Lofree Flow - web-ready models

11 GLB files in `models/`. Each holds **one geometry plus every colourway as a material variant**
(`KHR_materials_variants`), so a colour picker swaps materials without downloading another file.

| File | Variants |
|---|---|
| flow84, flow100 | Black, White |
| flow2_68, flow2_84, flow2_100 | Space Gray, Silver |
| flow2_84_mac, flow2_100_mac | Nebula, Petal, Volt (Mac legends) |
| flow_lite84, flow_lite100 | Off-White, Marble, Flamingo |
| flow_lite2_84, flow_lite2_100 | Black, White |

`manifest.json` lists files, sizes (mm), triangle counts, part names, variant names and a swatch colour per variant.
The first variant is the default.

## Changes for web use
- **Y-up, metres** (glTF standard). Originals were Z-up, mm, so they would have loaded standing on their back edge at 1000x scale.
  The conversion is a single root node, so the part nodes underneath are unchanged.
- **Pivot** is bottom-centre of the keyboard, so orbit controls rotate around the model.
- Texture-less, so UVs removed. Positions int16 / normals int8 (`KHR_mesh_quantization`, required), uint16 indices.
- Geometry fidelity: max error 0.003 mm, normals 0.36 deg. Triangle counts, part names and all material values are identical to the originals.

## model-viewer
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js"></script>
<model-viewer src="models/flow_lite84.glb" camera-controls environment-image="neutral" shadow-intensity="1"></model-viewer>
<script>document.querySelector('model-viewer').variantName = 'Marble';</script>
```
`demo.html` is a working colour-picker page. Serve the folder over HTTP (e.g. `npx serve .`); opening it via file:// blocks the model fetch.

## three.js
Use `GLTFLoader` (handles quantization). For variants, load the `GLTFMaterialsVariantsExtension` from the
`three-gltf-extensions` package, or skip variants and recolour parts by node name using `manifest.json`.
Metallic parts need an environment map (`scene.environment`) to look right.

## Hosting
Serve `.glb` as `model/gltf-binary` with gzip or brotli (about 250-290 KB per model on the wire) and long cache headers.
For another ~40-50% saving, run `gltf-transform meshopt` on these files and add `MeshoptDecoder` to your loader.
