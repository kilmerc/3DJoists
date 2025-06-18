// WhatIfTheJoistsAreDifferentButFastToo.js

// Simulates your library-based approach where joists are pre-tessellated
// and can be instantiated quickly regardless of uniqueness

import * as THREE from "three";
import { CreateJoist } from '../Joists/Joist.js';

// Pre-computed joist library - simulates your C++ library approach
const JOIST_LIBRARY = new Map();

// Initialize the joist library with pre-tessellated variants
export async function initializeJoistLibrary(oc) {
  console.log("Initializing joist library (simulating C++ pre-tessellation)...");
  
  // In your real app, this would be done once at startup with your C++ engine
  // and would contain hundreds/thousands of pre-computed joist variants
  
  const baseJoist = await CreateJoist(oc);
  
  // Apply the standard rotation (90 degrees around Y-axis)
  const transform = new oc.gp_Trsf_1();
  const yAxis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 1, 0));
  transform.SetRotation_1(yAxis, Math.PI / 2);
  const transformer = new oc.BRepBuilderAPI_Transform_2(baseJoist, transform, false);
  const rotatedJoist = transformer.Shape();
  
  // Pre-tessellate once (simulating your C++ library doing this at build time)
  const tessellatedGeometry = tessellateShapeOptimized(oc, rotatedJoist);
  
  // Store in library with different "variant IDs" - in reality these would be 
  // different joist specifications (different lengths, depths, web patterns, etc.)
  // but for demo purposes we'll reuse the same tessellated geometry
  for (let i = 0; i < 100; i++) {
    const variantId = `JOIST_48FT_36D_PATTERN_${i}`;
    JOIST_LIBRARY.set(variantId, {
      geometry: tessellatedGeometry,
      metadata: {
        length: 48 * 12 + (i % 5) * 12, // Simulate different lengths
        depth: 36 + (i % 3) * 6,         // Simulate different depths
        pattern: `Pattern_${i % 10}`,    // Simulate different web patterns
      }
    });
  }
  
  // Clean up intermediate shapes
  baseJoist.delete();
  transform.delete();
  yAxis.delete();
  transformer.delete();
  rotatedJoist.delete();
  
  console.log(`Joist library initialized with ${JOIST_LIBRARY.size} variants`);
}

// Optimized tessellation function (simulates minimal C++ overhead)
function tessellateShapeOptimized(oc, shape) {
  // Apply mesh generation
  new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, false);

  const allVertices = [];
  const allTriangles = [];
  let vertexOffset = 0;

  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );
  
  while (explorer.More()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const location = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, location, 0);

    if (!triangulation.IsNull()) {
      const tri = triangulation.get();
      const trans = location.Transformation();
      
      const nodeCount = tri.NbNodes();
      const triangleCount = tri.NbTriangles();
      
      if (nodeCount > 0 && triangleCount > 0) {
        // Extract vertices
        for (let i = 1; i <= nodeCount; i++) {
          const node = tri.Node(i);
          node.Transform(trans);
          allVertices.push(node.X(), node.Y(), node.Z());
        }

        // Extract triangles
        for (let i = 1; i <= triangleCount; i++) {
          const triangle = tri.Triangle(i);
          const n1 = triangle.Value(1);
          const n2 = triangle.Value(2);
          const n3 = triangle.Value(3);
          
          allTriangles.push(
            n1 - 1 + vertexOffset,
            n2 - 1 + vertexOffset,
            n3 - 1 + vertexOffset
          );
        }

        vertexOffset += nodeCount;
      }
      
      triangulation.delete();
    }

    location.delete();
    face.delete();
    explorer.Next();
  }
  explorer.delete();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(allVertices, 3)
  );
  
  if (allTriangles.length > 0) {
    geometry.setIndex(allTriangles);
  }

  geometry.computeVertexNormals();
  
  return geometry;
}

// Fast joist instantiation - simulates your library's InstantiateJoist() call
export function instantiateJoistFromLibrary(joistIndex, bayIndex, floorIndex) {
  // Simulate your real-world logic for selecting appropriate joist variant
  // In reality, this would look up based on structural requirements, load calculations, etc.
  
  // Fast lookup based on position/requirements (simulates engineering logic)
  const variantIndex = (joistIndex + bayIndex * 7 + floorIndex * 13) % 100;
  const variantId = `JOIST_48FT_36D_PATTERN_${variantIndex}`;
  
  const libraryEntry = JOIST_LIBRARY.get(variantId);
  if (!libraryEntry) {
    throw new Error(`Joist variant ${variantId} not found in library`);
  }
  
  // Return the pre-tessellated geometry and metadata
  // This is essentially instantaneous regardless of complexity
  return {
    geometry: libraryEntry.geometry,
    metadata: libraryEntry.metadata,
    variantId: variantId
  };
}

// Get library statistics
export function getLibraryStats() {
  return {
    totalVariants: JOIST_LIBRARY.size,
    memoryFootprint: `~${(JOIST_LIBRARY.size * 2).toFixed(1)}MB`, // Rough estimate
  };
}