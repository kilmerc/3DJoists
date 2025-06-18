import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import { CreateUniqueJoist } from "./WhatIfTheJoistsAreDifferent.js";
import { setupThreeJSViewport } from "../../common/scene.js";

function tessellateShape(oc, shape) {
  // Apply mesh generation with appropriate parameters
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
      
      // Get node count and triangle count
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

  // Check if we got any geometry
  if (allVertices.length === 0) {
    console.error("No vertices extracted from shape tessellation");
    // Create a simple fallback geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000, // Red to indicate error
      side: THREE.DoubleSide,
    });
    return { mesh: new THREE.Mesh(geometry, material), material: material };
  }

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

// Performance monitoring
function setupPerformanceMonitor(renderer) {
  const fpsElement = document.getElementById("fps");
  const trianglesElement = document.getElementById("triangles");
  const drawCallsElement = document.getElementById("draw-calls");
  const memoryElement = document.getElementById("memory");
  
  let frameCount = 0;
  let lastTime = performance.now();
  
  function updatePerformanceStats() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      fpsElement.textContent = `FPS: ${fps}`;
      frameCount = 0;
      lastTime = currentTime;
    }
    
    // Update render stats
    const info = renderer.info;
    trianglesElement.textContent = `Triangles: ${info.render.triangles.toLocaleString()}`;
    drawCallsElement.textContent = `Draw Calls: ${info.render.calls}`;
    
    // Rough memory estimation
    const memoryMB = Math.round(info.memory.geometries * 0.1 + info.memory.textures * 0.5);
    memoryElement.textContent = `Memory: ~${memoryMB}MB`;
    
    requestAnimationFrame(updatePerformanceStats);
  }
  
  updatePerformanceStats();
}

// Optimized batch processing to prevent browser freezing
async function createJoistsInBatches(oc, scene, progressCallback) {
  const joistsPerBay = 100;
  const numberOfBays = 10;
  const numberOfFloors = 5;
  const joistSpacing = 8 * 12;
  const bayWidth = 48 * 12;
  const storyHeight = 32 * 12;
  const totalJoists = numberOfFloors * numberOfBays * joistsPerBay;

  const totalLength = (joistsPerBay - 1) * joistSpacing;
  const totalWidth = numberOfBays * bayWidth;

  const BATCH_SIZE = 25; // Process in smaller batches to keep UI responsive
  const allMeshes = [];
  let joistCount = 0;

  // Shared material for all joists (optimization)
  const material = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
  });

  // Process in batches
  for (let floorIndex = 0; floorIndex < numberOfFloors; floorIndex++) {
    const yPosition = floorIndex * storyHeight;
    
    for (let bayIndex = 0; bayIndex < numberOfBays; bayIndex++) {
      // Process joists in this bay in smaller batches
      for (let batchStart = 0; batchStart < joistsPerBay; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, joistsPerBay);
        
        // Create this batch of joists
        for (let joistIndex = batchStart; joistIndex < batchEnd; joistIndex++) {
          const xPosition = joistIndex * joistSpacing - totalLength / 2;
          const zPosition = bayIndex * bayWidth - totalWidth / 2 + bayWidth / 2;

          // Create unique joist shape
          const joistShape = await CreateUniqueJoist(oc, joistIndex, bayIndex, floorIndex);
          
          // Tessellate the unique shape
          const geometry = tessellateShape(oc, joistShape);
          
          // Create mesh
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(xPosition, yPosition, zPosition);
          
          // Add to scene
          scene.add(mesh);
          allMeshes.push(mesh);
          
          // Clean up OpenCascade shape
          joistShape.delete();
          
          joistCount++;
          
          // Update progress
          if (progressCallback) {
            const percentage = Math.round((joistCount / totalJoists) * 100);
            progressCallback(
              `Creating unique joist ${joistCount} of ${totalJoists} (${percentage}%)`,
              joistCount,
              totalJoists
            );
          }
        }
        
        // Yield control back to browser after each batch
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  return allMeshes;
}

// This is the main function for our demo
async function main() {
  const loader = document.getElementById("loader");
  const progressText = document.getElementById("progress-text");
  const timeInfo = document.getElementById("time-info");
  loader.classList.remove("hidden");

  const scene = setupThreeJSViewport();
  if (!scene) {
    loader.classList.add("hidden");
    return;
  }

  // Track total time
  const startTime = performance.now();

  try {
    progressText.innerText = "Initializing OpenCascade...";
    const oc = await initOpenCascade();

    progressText.innerText = "Creating 5000 unique joists...";
    timeInfo.innerText = "This will take significantly longer than instanced rendering";

    // Create all unique joists
    const allMeshes = await createJoistsInBatches(oc, scene, (message, current, total) => {
      progressText.innerText = message;
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      const estimated = total > 0 ? ((elapsed / current) * total).toFixed(1) : "?";
      timeInfo.innerText = `Elapsed: ${elapsed}s | Estimated Total: ${estimated}s`;
    });

    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);

    console.log(`Created ${allMeshes.length} unique joists in ${totalTime} seconds`);
    console.log(`Average time per joist: ${(parseFloat(totalTime) / allMeshes.length * 1000).toFixed(1)}ms`);
    
    progressText.innerText = `Complete! 5000 unique joists created in ${totalTime}s`;
    timeInfo.innerText = `Avg: ${(parseFloat(totalTime) / allMeshes.length * 1000).toFixed(1)}ms per joist`;
    
    // Setup performance monitoring
    const renderer = scene.userData?.renderer;
    if (renderer) {
      setupPerformanceMonitor(renderer);
    }
    
    // Small delay before hiding loader to show completion message
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 2000);

  } catch (error) {
    console.error("Error in main:", error);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    progressText.innerText = "Error occurred. Check console for details.";
    timeInfo.innerText = `Failed after ${elapsed}s`;
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 2000);
  }
}

main();