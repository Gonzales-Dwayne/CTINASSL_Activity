"""Convert a STEP file into a web-friendly GLB using OpenCASCADE tessellation.

Usage:
    python tools/step_to_glb.py <input.step> <output.glb> [--deflection 0.2] [--target-tris 120000]

Unlike a mesher, this uses OpenCASCADE's BRepMesh to triangulate each face
directly, which handles SolidWorks exports with tiny/sliver faces reliably.
The result is centred at the origin, rotated Z-up -> Y-up, and scaled to ~1 unit.
"""

import argparse
import sys

import numpy as np
import trimesh
from OCP.BRep import BRep_Tool
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.IFSelect import IFSelect_RetDone
from OCP.STEPControl import STEPControl_Reader
from OCP.TopAbs import TopAbs_FACE, TopAbs_REVERSED
from OCP.TopExp import TopExp_Explorer
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS


def read_step(path):
    reader = STEPControl_Reader()
    if reader.ReadFile(path) != IFSelect_RetDone:
        raise SystemExit(f"Could not read {path}")
    reader.TransferRoots()
    return reader.OneShape()


def tessellate(shape, linear_deflection, angular_deflection=0.35):
    BRepMesh_IncrementalMesh(shape, linear_deflection, False, angular_deflection, True)

    vertices = []
    faces = []
    offset = 0

    explorer = TopExp_Explorer(shape, TopAbs_FACE)
    while explorer.More():
        face = TopoDS.Face(explorer.Current())
        location = TopLoc_Location()
        triangulation = BRep_Tool.Triangulation_s(face, location)

        if triangulation is not None:
            transform = location.Transformation()
            node_count = triangulation.NbNodes()

            points = np.empty((node_count, 3), dtype=np.float64)
            for index in range(1, node_count + 1):
                point = triangulation.Node(index)
                point.Transform(transform)
                points[index - 1] = (point.X(), point.Y(), point.Z())

            triangle_count = triangulation.NbTriangles()
            triangles = np.empty((triangle_count, 3), dtype=np.int64)
            for index in range(1, triangle_count + 1):
                a, b, c = triangulation.Triangle(index).Get()
                triangles[index - 1] = (a - 1, b - 1, c - 1)

            if face.Orientation() == TopAbs_REVERSED:
                triangles = triangles[:, [0, 2, 1]]

            vertices.append(points)
            faces.append(triangles + offset)
            offset += node_count

        explorer.Next()

    if not faces:
        raise SystemExit("No triangulation produced from this STEP file.")

    return trimesh.Trimesh(
        vertices=np.vstack(vertices),
        faces=np.vstack(faces),
        process=True,
    )


def normalise(mesh):
    mesh.apply_transform(
        trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0])
    )
    mesh.apply_translation(-mesh.bounding_box.centroid)
    scale = max(mesh.extents)
    if scale > 0:
        mesh.apply_scale(1.0 / scale)
    return mesh


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("destination")
    parser.add_argument("--deflection", type=float, default=0.2)
    parser.add_argument("--target-tris", type=int, default=120_000)
    parser.add_argument(
        "--color", default="2563eb", help="base colour as hex (no #)"
    )
    args = parser.parse_args()

    shape = read_step(args.source)
    mesh = tessellate(shape, args.deflection)
    print(f"tessellated: {len(mesh.vertices)} verts, {len(mesh.faces)} faces")

    if len(mesh.faces) > args.target_tris:
        import fast_simplification

        vertices, faces = fast_simplification.simplify(
            mesh.vertices.astype(np.float32),
            mesh.faces.astype(np.int32),
            target_reduction=1.0 - (args.target_tris / len(mesh.faces)),
        )
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
        print(f"decimated: {len(mesh.faces)} faces")

    mesh = normalise(mesh)

    color = args.color.lstrip("#")
    rgba = [int(color[i : i + 2], 16) / 255 for i in (0, 2, 4)] + [1.0]
    mesh.visual = trimesh.visual.TextureVisuals(
        material=trimesh.visual.material.PBRMaterial(
            baseColorFactor=rgba,
            metallicFactor=0.25,
            roughnessFactor=0.45,
        )
    )

    mesh.export(args.destination, file_type="glb")
    print(f"wrote {args.destination} ({len(mesh.faces)} faces)", file=sys.stderr)


if __name__ == "__main__":
    main()
