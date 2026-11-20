"""Simplify the Lofree lineup GLBs so the hero can render them crisply.

Per-mesh quadric decimation keeps every part and its PBR material, but cuts the
triangle count by ~55%, which buys headroom for full-resolution rendering.

Usage:
    python tools/simplify_glb.py <input.glb> <output.glb> [--reduction 0.55]
"""

import argparse
import sys

import fast_simplification
import numpy as np
import trimesh


def simplify(geometry, reduction):
    vertices = np.asarray(geometry.vertices, dtype=np.float32)
    faces = np.asarray(geometry.faces, dtype=np.int32)

    new_vertices, new_faces = fast_simplification.simplify(
        vertices,
        faces,
        target_reduction=reduction,
    )

    simplified = trimesh.Trimesh(
        vertices=new_vertices,
        faces=new_faces,
        process=False,
    )
    simplified.visual = geometry.visual
    return simplified


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("destination")
    parser.add_argument("--reduction", type=float, default=0.55)
    parser.add_argument("--min-faces", type=int, default=400)
    args = parser.parse_args()

    scene = trimesh.load(args.source, force="scene")

    before = 0
    after = 0

    for name, geometry in list(scene.geometry.items()):
        face_count = len(geometry.faces)
        before += face_count

        if face_count <= args.min_faces:
            after += face_count
            continue

        try:
            scene.geometry[name] = simplify(geometry, args.reduction)
            after += len(scene.geometry[name].faces)
        except Exception as error:  # noqa: BLE001 - leave the part untouched
            print(f"  skipped {name}: {error}", file=sys.stderr)
            after += face_count

    scene.export(args.destination, file_type="glb")

    kept = 100 - (after / before * 100 if before else 0)
    print(
        f"{args.destination}: {before:,} → {after:,} tris (-{kept:.0f}%)",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
