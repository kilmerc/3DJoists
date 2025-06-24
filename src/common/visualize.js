/**
 * Modern OpenCascade Shape Visualization
 * 
 * This module provides an optimized approach for converting OpenCascade shapes
 * into Three.js BufferGeometry objects. It's more efficient than the legacy
 * openCascadeHelper approach as it uses BufferGeometry instead of deprecated
 * Geometry and Face3 objects.
 * 
 * Key improvements:
 * - Uses BufferGeometry for better performance
 * - Direct Float32Array usage for vertices and normals
 * - Proper memory management with OpenCascade object cleanup
 * - Support for both Uint16Array and Uint32Array indices based on vertex count
 * 
 * @param {Object} openCascade - OpenCascade.js instance
 * @param {Object} shape - OpenCascade shape to visualize
 * @returns {Array} Array of Three.js BufferGeometry objects (one per face)
 */

import * as THREE from 'three'

export default function visualize(openCascade, shape) {
  let geometries = []
  
  // === FACE EXPLORATION ===
  // Create explorer to iterate through all faces of the shape
  const ExpFace = new openCascade.TopExp_Explorer_1();
  
  // Initialize explorer to find all faces in the shape
  for (ExpFace.Init(shape, openCascade.TopAbs_ShapeEnum.TopAbs_FACE, openCascade.TopAbs_ShapeEnum.TopAbs_SHAPE); 
       ExpFace.More(); 
       ExpFace.Next()) {
    
    const myShape = ExpFace.Current();
    const myFace = openCascade.TopoDS.Face_1(myShape);
    
    let inc;
    try {
      // === MESH GENERATION ===
      // Apply incremental mesh generation to this face
      // Parameters: face, linear deflection, relative deflection, angular deflection, parallel
      inc = new openCascade.BRepMesh_IncrementalMesh_2(myFace, 0.1, false, 0.5, false);
    } catch (e) {
      console.error('Face visualization failed:', e);
      continue; // Skip faces that can't be meshed
    }

    // === TRIANGULATION EXTRACTION ===
    const aLocation = new openCascade.TopLoc_Location_1();
    const myT = openCascade.BRep_Tool.Triangulation(myFace, aLocation, 0);
    
    // Skip faces without triangulation data
    if (myT.IsNull()) {
      // Clean up before continuing
      inc.delete();
      myFace.delete();
      myShape.delete();
      aLocation.delete();
      continue;
    }

    // Get triangulation data and transformation
    const pc = new openCascade.Poly_Connect_2(myT);
    const triangulation = myT.get();
    const nodeCount = triangulation.NbNodes();
    const triangleCount = triangulation.NbTriangles();
    
    // Skip empty triangulations
    if (nodeCount === 0 || triangleCount === 0) {
      // Clean up before continuing
      pc.delete();
      aLocation.delete();
      myT.delete();
      inc.delete();
      myFace.delete();
      myShape.delete();
      continue;
    }

    // === VERTEX PROCESSING ===
    // Create vertices array (3 floats per vertex: x, y, z)
    let vertices = new Float32Array(nodeCount * 3);

    // Extract and transform vertices
    for (let i = 1; i <= nodeCount; i++) {
      // Get vertex point
      const t1 = aLocation.Transformation();
      const p = triangulation.Node(i);
      const p1 = p.Transformed(t1);
      
      // Store vertex coordinates
      const vertexIndex = 3 * (i - 1);
      vertices[vertexIndex] = p1.X();
      vertices[vertexIndex + 1] = p1.Y();
      vertices[vertexIndex + 2] = p1.Z();
      
      // Clean up temporary objects
      p.delete();
      t1.delete();
      p1.delete();
    }

    // === NORMAL PROCESSING ===
    // Calculate normals for each vertex
    const myNormal = new openCascade.TColgp_Array1OfDir_2(1, nodeCount);
    openCascade.StdPrs_ToolTriangulatedShape.Normal(myFace, pc, myNormal);

    // Create normals array (3 floats per normal: x, y, z)
    let normals = new Float32Array(myNormal.Length() * 3);
    
    // Extract and transform normals
    for (let i = myNormal.Lower(); i <= myNormal.Upper(); i++) {
      const t1 = aLocation.Transformation();
      const d1 = myNormal.Value(i);
      const d = d1.Transformed(t1);

      // Store normal components
      const normalIndex = 3 * (i - 1);
      normals[normalIndex] = d.X();
      normals[normalIndex + 1] = d.Y();
      normals[normalIndex + 2] = d.Z();

      // Clean up temporary objects
      t1.delete();
      d1.delete();
      d.delete();
    }

    // Clean up normal array
    myNormal.delete();

    // === TRIANGLE INDEX PROCESSING ===
    // Get face orientation for proper triangle winding
    const orient = myFace.Orientation_1();
    const triangles = myT.get().Triangles();
    
    // Choose appropriate index array type based on vertex count
    // Use Uint32Array for large meshes (>65535 vertices), otherwise Uint16Array
    let indices;
    let triLength = triangles.Length() * 3;
    if (triLength > 65535) {
      indices = new Uint32Array(triLength);
    } else {
      indices = new Uint16Array(triLength);
    }

    // Extract triangle indices with proper orientation handling
    for (let nt = 1; nt <= triangulation.NbTriangles(); nt++) {
      const t = triangles.Value(nt);
      let n1 = t.Value(1);
      let n2 = t.Value(2);
      let n3 = t.Value(3);
      
      // Handle face orientation by swapping vertices if needed
      // This ensures consistent triangle winding for proper lighting
      if (orient !== openCascade.TopAbs_Orientation.TopAbs_FORWARD) {
        let tmp = n1;
        n1 = n2;
        n2 = tmp;
      }

      // Store triangle indices (convert from 1-based to 0-based indexing)
      const triangleIndex = 3 * (nt - 1);
      indices[triangleIndex] = n1 - 1;
      indices[triangleIndex + 1] = n2 - 1;
      indices[triangleIndex + 2] = n3 - 1;
      
      // Clean up triangle object
      t.delete();
    }
    
    // Clean up triangles collection
    triangles.delete();

    // === BUFFER GEOMETRY CREATION ===
    // Create Three.js BufferGeometry with the extracted data
    let geometry = new THREE.BufferGeometry();
    
    // Set vertex positions
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Set vertex normals
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

    // Set triangle indices
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    
    // Add this geometry to the results array
    geometries.push(geometry);

    // === CLEANUP ===
    // Clean up all OpenCascade objects to prevent memory leaks
    pc.delete();
    aLocation.delete();
    myT.delete();
    inc.delete();
    myFace.delete();
    myShape.delete();
  }
  
  // Clean up explorer
  ExpFace.delete();
  
  return geometries;
}