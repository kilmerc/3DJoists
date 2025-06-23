// TheBigKahuna.js

// Simulates your library-based approach with 2000 pre-tessellated joist variants
// for 10,000 joist instances across 10 floors

import * as THREE from "three";
import { CreateJoist } from '../Joists/Joist.js';

// Pre-computed joist library - simulates your C++ library approach with 2000 variants
const JOIST_LIBRARY = new Map();

// Initialize the joist library with pre-tessellated variants
export async function initializeJoistLibrary(oc) {
  console.log("Initializing BIG KAHUNA joist library (simulating C++ pre-tessellation)...");
  
  // In your real app, this would be done once at startup with your C++ engine
  // and would contain thousands of pre-computed joist variants
  
  const baseJoist = await CreateJoist(oc);
  
  // Apply the standard rotation (90 degrees around Y-axis)
  const transform = new oc.gp_Trsf_1();
  const yAxis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 1, 0));
  transform.SetRotation_1(yAxis, Math.PI / 2);
  const transformer = new oc.BRepBuilderAPI_Transform_2(baseJoist, transform, false);
  const rotatedJoist = transformer.Shape();
  
  // Pre-tessellate once (simulating your C++ library doing this at build time)
  const tessellatedGeometry = tessellateShapeOptimized(oc, rotatedJoist);
  
  // Store in library with 2000 different "variant IDs" - in reality these would be 
  // different joist specifications (different lengths, depths, web patterns, etc.)
  // but for demo purposes we'll reuse the same tessellated geometry
  for (let i = 0; i < 2000; i++) {
    const variantId = `JOIST_${Math.floor(i/40)+35}FT_${24+(i%12)*2}D_PAT${i%75}_REV${Math.floor(i/200)}_SPEC${Math.floor(i/50)}`;
    JOIST_LIBRARY.set(variantId, {
      geometry: tessellatedGeometry,
      metadata: {
        length: (Math.floor(i/40) + 35) * 12,      // 35-84 ft lengths (expanded range)
        depth: 24 + (i % 12) * 2,                  // 24-46 inch depths (expanded range)
        pattern: `WebPattern_${i % 75}`,           // 75 different web patterns (more variety)
        revision: Math.floor(i / 200),             // Design revisions (0-9)
        specification: Math.floor(i / 50),         // Different specs (0-39)
        loadRating: 40 + (i % 40) * 4,            // 40-196 load ratings (expanded range)
        steelGrade: ['A36', 'A572-50', 'A992'][i % 3], // Different steel grades
        coating: ['Galvanized', 'Painted', 'Bare'][i % 3], // Different coatings
      }
    });
  }
  
  // Clean up intermediate shapes
  baseJoist.delete();
  transform.delete();
  yAxis.delete();
  transformer.delete();
  rotatedJoist.delete();
  
  console.log(`BIG KAHUNA joist library initialized with ${JOIST_LIBRARY.size} variants`);
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
  
  // More sophisticated lookup based on position/requirements (simulates engineering logic)
  // This creates a more realistic distribution across the 2000 variants
  const structuralHash = (joistIndex * 11 + bayIndex * 31 + floorIndex * 53) % 2000;
  const lengthCategory = Math.floor(structuralHash / 40) + 35;  // 35-84 ft
  const depthCategory = 24 + (structuralHash % 12) * 2;        // 24-46 inch
  const patternNum = structuralHash % 75;                      // 0-74 patterns
  const revision = Math.floor(structuralHash / 200);          // 0-9 revisions
  const specification = Math.floor(structuralHash / 50);      // 0-39 specs
  
  const variantId = `JOIST_${lengthCategory}FT_${depthCategory}D_PAT${patternNum}_REV${revision}_SPEC${specification}`;
  
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
    memoryFootprint: `~${(JOIST_LIBRARY.size * 2).toFixed(1)}MB`, // Rough estimate for 2000 variants
    lengthRange: "35-84 feet",
    depthRange: "24-46 inches", 
    webPatterns: "75 unique patterns",
    designRevisions: "10 revisions",
    specifications: "40 different specs",
    steelGrades: "3 grades (A36, A572-50, A992)",
    coatings: "3 types (Galvanized, Painted, Bare)"
  };
}