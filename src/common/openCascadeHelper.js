/**
 * OpenCascade Helper Utilities
 * 
 * This module provides utilities for converting OpenCascade shapes into Three.js geometries.
 * It handles the complex process of tessellating CAD shapes and converting them into
 * mesh data that can be rendered in a web browser.
 * 
 * Main workflow:
 * 1. tessellate() - Converts OpenCascade shape into triangulated mesh data
 * 2. joinPrimitives() - Combines multiple face data into unified arrays
 * 3. generateGeometry() - Creates Three.js compatible geometry data
 */

import {
  Face3,
  Vector3
} from 'three';

const openCascadeHelper = {
  /**
   * Sets the OpenCascade instance to use for all operations
   * @param {Object} openCascade - The OpenCascade.js instance
   */
  setOpenCascade(openCascade) {
    this.openCascade = openCascade;
  },

  /**
   * Tessellates an OpenCascade shape into triangulated mesh data
   * 
   * This is the core function that converts CAD geometry into renderable triangles.
   * It processes each face of the shape and extracts vertex coordinates, normals,
   * and triangle indices.
   * 
   * @param {Object} shape - OpenCascade shape to tessellate
   * @returns {Array} Array of face objects containing mesh data
   */
  tessellate(shape) {
    const facelist = [];
    
    // Apply incremental mesh generation to the shape
    // Parameters: shape, linear deflection, relative deflection, angular deflection, parallel
    new this.openCascade.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, false);
    
    // Create explorer to iterate through all faces of the shape
    const ExpFace = new this.openCascade.TopExp_Explorer_1();
    
    // Initialize explorer to find all faces in the shape
    for (ExpFace.Init(shape, this.openCascade.TopAbs_ShapeEnum.TopAbs_FACE, this.openCascade.TopAbs_ShapeEnum.TopAbs_SHAPE); 
         ExpFace.More(); 
         ExpFace.Next()) {
      
      // Get the current face from the explorer
      const myFace = this.openCascade.TopoDS.Face_1(ExpFace.Current());
      const aLocation = new this.openCascade.TopLoc_Location_1();
      
      // Get the triangulation data for this face
      const myT = this.openCascade.BRep_Tool.Triangulation(myFace, aLocation, 0);
      
      // Skip faces that don't have triangulation data
      if (myT.IsNull()) {
        continue;
      }

      // Initialize face data structure
      const this_face = {
        vertex_coord: [],     // Vertex coordinates (x, y, z) for each vertex
        normal_coord: [],     // Normal vectors (x, y, z) for each vertex
        tri_indexes: [],      // Triangle indices (3 vertex indices per triangle)
        number_of_triangles: 0,
      };

      // Create polygon connectivity helper for normal calculations
      const pc = new this.openCascade.Poly_Connect_2(myT);
      const triangulation = myT.get();

      // === EXTRACT VERTICES ===
      // Build vertex buffer with transformed coordinates
      this_face.vertex_coord = new Array(triangulation.NbNodes() * 3);
      for (let i = 1; i <= triangulation.NbNodes(); i++) {
        // Get vertex and apply location transformation
        const p = triangulation.Node(i).Transformed(aLocation.Transformation());
        
        // Store x, y, z coordinates
        this_face.vertex_coord[((i - 1) * 3) + 0] = p.X();
        this_face.vertex_coord[((i - 1) * 3) + 1] = p.Y();
        this_face.vertex_coord[((i - 1) * 3) + 2] = p.Z();
      }

      // === EXTRACT NORMALS ===
      // Calculate normals for each vertex
      const myNormal = new this.openCascade.TColgp_Array1OfDir_2(1, triangulation.NbNodes());
      this.openCascade.StdPrs_ToolTriangulatedShape.Normal(myFace, pc, myNormal);
      
      this_face.normal_coord = new Array(myNormal.Length() * 3);
      for (let i = myNormal.Lower(); i <= myNormal.Upper(); i++) {
        // Get normal direction and apply location transformation
        const d = myNormal.Value(i).Transformed(aLocation.Transformation());
        
        // Store normal x, y, z components
        this_face.normal_coord[((i - 1) * 3) + 0] = d.X();
        this_face.normal_coord[((i - 1) * 3) + 1] = d.Y();
        this_face.normal_coord[((i - 1) * 3) + 2] = d.Z();
      }

      // === EXTRACT TRIANGLES ===
      // Process triangle indices, handling face orientation
      const orient = myFace.Orientation_1();
      const triangles = myT.get().Triangles();
      this_face.tri_indexes = new Array(triangles.Length() * 3);
      let validFaceTriCount = 0;
      
      for (let nt = 1; nt <= myT.get().NbTriangles(); nt++) {
        const t = triangles.Value(nt);
        let n1 = t.Value(1);
        let n2 = t.Value(2);
        let n3 = t.Value(3);
        
        // Handle face orientation by swapping vertices if needed
        if (orient !== this.openCascade.TopAbs_Orientation.TopAbs_FORWARD) {
          let tmp = n1;
          n1 = n2;
          n2 = tmp;
        }
        
        // Store triangle vertex indices
        this_face.tri_indexes[(validFaceTriCount * 3) + 0] = n1;
        this_face.tri_indexes[(validFaceTriCount * 3) + 1] = n2;
        this_face.tri_indexes[(validFaceTriCount * 3) + 2] = n3;
        validFaceTriCount++;
      }
      
      this_face.number_of_triangles = validFaceTriCount;
      facelist.push(this_face);
    }
    
    return facelist;
  },

  /**
   * Combines multiple face data arrays into unified vertex, normal, and triangle arrays
   * 
   * This function takes the per-face data from tessellate() and creates single
   * unified arrays that can be used to create a single Three.js geometry.
   * It also adjusts triangle indices to account for the combined vertex array.
   * 
   * @param {Array} facelist - Array of face objects from tessellate()
   * @returns {Array} [vertices, normals, triangleIndices] - Combined arrays
   */
  joinPrimitives(facelist) {
    let obP = 0;   // Vertex counter
    let obN = 0;   // Normal counter  
    let obTR = 0;  // Triangle counter
    let advance = 0; // Vertex index offset for triangle indices
    
    const locVertexcoord = [];  // Combined vertex coordinates
    const locNormalcoord = [];  // Combined normal coordinates
    const locTriIndices = [];   // Combined triangle indices

    // Process each face's data
    facelist.forEach(myface => {
      // === COPY VERTICES ===
      for (let x = 0; x < myface.vertex_coord.length / 3; x++) {
        locVertexcoord[(obP * 3) + 0] = myface.vertex_coord[(x * 3) + 0];
        locVertexcoord[(obP * 3) + 1] = myface.vertex_coord[(x * 3) + 1];
        locVertexcoord[(obP * 3) + 2] = myface.vertex_coord[(x * 3) + 2];
        obP++;
      }
      
      // === COPY NORMALS ===
      for (let x = 0; x < myface.normal_coord.length / 3; x++) {
        locNormalcoord[(obN * 3) + 0] = myface.normal_coord[(x * 3) + 0];
        locNormalcoord[(obN * 3) + 1] = myface.normal_coord[(x * 3) + 1];
        locNormalcoord[(obN * 3) + 2] = myface.normal_coord[(x * 3) + 2];
        obN++;
      }
      
      // === COPY TRIANGLE INDICES (with offset adjustment) ===
      for (let x = 0; x < myface.tri_indexes.length / 3; x++) {
        // Adjust indices to account for previously added vertices
        locTriIndices[(obTR * 3) + 0] = myface.tri_indexes[(x * 3) + 0] + advance - 1;
        locTriIndices[(obTR * 3) + 1] = myface.tri_indexes[(x * 3) + 1] + advance - 1;
        locTriIndices[(obTR * 3) + 2] = myface.tri_indexes[(x * 3) + 2] + advance - 1;
        obTR++;
      }

      // Update the vertex offset for the next face
      advance = obP;
    });
    
    return [locVertexcoord, locNormalcoord, locTriIndices];
  },

  /**
   * Gets triangle vertex and normal indices for a specific triangle
   * 
   * Helper function that extracts the vertex and normal indices for a given triangle.
   * Used internally by generateGeometry().
   * 
   * @param {number} trianglenum - Triangle index to process
   * @param {Array} locTriIndices - Array of triangle indices
   * @returns {Array} [vertexIndices, normalIndices, texcoordIndices]
   */
  objGetTriangle(trianglenum, locTriIndices) {
    // Calculate byte offsets for the three vertices of this triangle
    const pID = locTriIndices[(trianglenum * 3) + 0] * 3;
    const qID = locTriIndices[(trianglenum * 3) + 1] * 3;
    const rID = locTriIndices[(trianglenum * 3) + 2] * 3;

    // Return indices for vertices, normals, and texture coordinates
    // (normals use same indices as vertices in our case)
    const vertices = [pID, qID, rID];
    const normals = [pID, qID, rID];
    const texcoords = [pID, qID, rID]; // Not used but included for compatibility
    
    return [vertices, normals, texcoords];
  },

  /**
   * Generates Three.js compatible geometry data from tessellated mesh data
   * 
   * This function creates the final vertex and face arrays that can be used
   * to construct a Three.js Geometry object. It processes triangle data and
   * creates Three.js Face3 objects with proper vertex and normal data.
   * 
   * @param {number} tot_triangle_count - Total number of triangles
   * @param {Array} locVertexcoord - Combined vertex coordinates
   * @param {Array} locNormalcoord - Combined normal coordinates  
   * @param {Array} locTriIndices - Combined triangle indices
   * @returns {Array} [vertices, faces] - Three.js compatible data
   */
  generateGeometry(tot_triangle_count, locVertexcoord, locNormalcoord, locTriIndices) {
    const vertices = [];  // Array of Vector3 objects
    const faces = [];     // Array of Face3 objects
    
    /**
     * Helper function to add a vertex to the vertices array
     */
    function v(x, y, z) {
      vertices.push(new Vector3(x, y, z));
    }
    
    /**
     * Helper function to create a Face3 with vertex and normal data
     */
    function f3(a, b, c, n1_x, n1_y, n1_z, n2_x, n2_y, n2_z, n3_x, n3_y, n3_z) {
      faces.push(new Face3(a, b, c, [
        new Vector3(n1_x, n1_y, n1_z),
        new Vector3(n2_x, n2_y, n2_z),
        new Vector3(n3_x, n3_y, n3_z)
      ]));
    }
    
    // === CREATE VERTICES ===
    // Process each triangle and add its vertices to the vertices array
    for (let i = 0; i < tot_triangle_count; i++) {
      const [vertices_idx, /*normals_idx*/, /*texcoords_idx*/] = this.objGetTriangle(i, locTriIndices);
      
      // Add the three vertices of this triangle
      // First vertex
      v(
        locVertexcoord[vertices_idx[0] + 0],
        locVertexcoord[vertices_idx[0] + 1],
        locVertexcoord[vertices_idx[0] + 2]
      );
      // Second vertex
      v(
        locVertexcoord[vertices_idx[1] + 0],
        locVertexcoord[vertices_idx[1] + 1],
        locVertexcoord[vertices_idx[1] + 2]
      );
      // Third vertex
      v(
        locVertexcoord[vertices_idx[2] + 0],
        locVertexcoord[vertices_idx[2] + 1],
        locVertexcoord[vertices_idx[2] + 2]
      );
    }
    
    // === CREATE FACES ===
    // Process each triangle and create Face3 objects with normals
    for (let i = 0; i < tot_triangle_count; i++) {
      const [/*vertices_idx*/, normals_idx, /*texcoords_idx*/] = this.objGetTriangle(i, locTriIndices);
      
      // Create face with vertex indices and normal vectors
      f3(
        0 + i * 3,  // First vertex index
        1 + i * 3,  // Second vertex index  
        2 + i * 3,  // Third vertex index
        // Normal for first vertex
        locNormalcoord[normals_idx[0] + 0],
        locNormalcoord[normals_idx[0] + 1],
        locNormalcoord[normals_idx[0] + 2],
        // Normal for second vertex
        locNormalcoord[normals_idx[1] + 0],
        locNormalcoord[normals_idx[1] + 1],
        locNormalcoord[normals_idx[1] + 2],
        // Normal for third vertex
        locNormalcoord[normals_idx[2] + 0],
        locNormalcoord[normals_idx[2] + 1],
        locNormalcoord[normals_idx[2] + 2]
      );
    }
    
    return [vertices, faces];
  }
}

export default openCascadeHelper;