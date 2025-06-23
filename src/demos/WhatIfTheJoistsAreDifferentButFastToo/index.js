import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import { 
  initializeJoistLibrary, 
  instantiateJoistFromLibrary, 
  getLibraryStats 
} from "./WhatIfTheJoistsAreDifferentButFastToo.js";
import { setupThreeJSViewport } from "../../common/scene.js";

// Performance monitoring
function setupPerformanceMonitor(renderer) {
  const fpsElement = document.getElementById("fps");
  const trianglesElement = document.getElementById("triangles");
  const drawCallsElement = document.getElementById("draw-calls");
  const memoryElement = document.getElementById("memory");
  const instantiationElement = document.getElementById("instantiation-speed");
  
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

// Update library info display
function updateLibraryInfo(stats, uniqueJoistCount, avgInstantiationTime) {
  const variantsElement = document.getElementById("library-variants");
  const libraryMemoryElement = document.getElementById("library-memory");
  const librarySpecsElement = document.getElementById("library-specs");
  const uniqueJoistsElement = document.getElementById("unique-joists");
  const instantiationElement = document.getElementById("instantiation-speed");
  
  variantsElement.textContent = `Variants: ${stats.totalVariants}`;
  libraryMemoryElement.textContent = `Library Size: ${stats.memoryFootprint}`;
  librarySpecsElement.textContent = `Specs: ${stats.lengthRange}, ${stats.depthRange}`;
  uniqueJoistsElement.textContent = `Unique Instances: ${uniqueJoistCount}`;
  instantiationElement.textContent = `Avg Instantiation: ${avgInstantiationTime}ms`;
}

// Fast joist creation using library approach
async function createJoistsFromLibrary(scene, progressCallback) {
  const joistsPerBay = 100;
  const numberOfBays = 10;
  const numberOfFloors = 5;
  const joistSpacing = 8 * 12;
  const bayWidth = 48 * 12;
  const storyHeight = 32 * 12;
  const totalJoists = numberOfFloors * numberOfBays * joistsPerBay;

  const totalLength = (joistsPerBay - 1) * joistSpacing;
  const totalWidth = numberOfBays * bayWidth;

  const allMeshes = [];
  const uniqueVariants = new Set();
  let joistCount = 0;
  const instantiationTimes = [];

  // Shared material for optimization
  const material = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
  });

  // Create joists floor by floor
  for (let floorIndex = 0; floorIndex < numberOfFloors; floorIndex++) {
    const yPosition = floorIndex * storyHeight;
    
    for (let bayIndex = 0; bayIndex < numberOfBays; bayIndex++) {
      for (let joistIndex = 0; joistIndex < joistsPerBay; joistIndex++) {
        const xPosition = joistIndex * joistSpacing - totalLength / 2;
        const zPosition = bayIndex * bayWidth - totalWidth / 2 + bayWidth / 2;

        // Fast instantiation from library (simulates your C++ library call)
        const instantiationStart = performance.now();
        const joistData = instantiateJoistFromLibrary(joistIndex, bayIndex, floorIndex);
        const instantiationEnd = performance.now();
        
        instantiationTimes.push(instantiationEnd - instantiationStart);
        uniqueVariants.add(joistData.variantId);

        // Create mesh using pre-tessellated geometry
        const mesh = new THREE.Mesh(joistData.geometry, material);
        mesh.position.set(xPosition, yPosition, zPosition);
        mesh.userData = {
          variantId: joistData.variantId,
          metadata: joistData.metadata
        };
        
        scene.add(mesh);
        allMeshes.push(mesh);
        
        joistCount++;
        
        // Update progress less frequently to maintain speed
        if (joistCount % 100 === 0 || joistCount === totalJoists) {
          if (progressCallback) {
            const percentage = Math.round((joistCount / totalJoists) * 100);
            const avgInstTime = (instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length).toFixed(3);
            progressCallback(
              `Instantiating joist ${joistCount} of ${totalJoists} (${percentage}%)`,
              joistCount,
              totalJoists,
              uniqueVariants.size,
              avgInstTime
            );
          }
          
          // Small yield to prevent browser freezing
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
  }

  const avgInstantiationTime = (instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length).toFixed(3);
  
  return {
    meshes: allMeshes,
    uniqueVariantsUsed: uniqueVariants.size,
    avgInstantiationTime: avgInstantiationTime
  };
}

// Main function
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

  const startTime = performance.now();

  try {
    progressText.innerText = "Initializing OpenCascade...";
    const oc = await initOpenCascade();

    progressText.innerText = "Pre-tessellating joist library...";
    timeInfo.innerText = "This one-time cost simulates your C++ library initialization";
    
    // Initialize the library (one-time cost, like your C++ startup)
    const libraryStart = performance.now();
    await initializeJoistLibrary(oc);
    const libraryEnd = performance.now();
    const libraryTime = ((libraryEnd - libraryStart) / 1000).toFixed(2);
    
    const stats = getLibraryStats();
    
    progressText.innerText = "Instantiating 5000 unique joists from library...";
    timeInfo.innerText = `Library loaded in ${libraryTime}s. Now instantiating...`;

    // Create all joists using fast library approach
    const result = await createJoistsFromLibrary(scene, (message, current, total, uniqueCount, avgTime) => {
      progressText.innerText = message;
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${elapsed}s | Avg: ${avgTime}ms per joist`;
      
      // Update library info in real-time
      updateLibraryInfo(stats, uniqueCount, avgTime);
    });

    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    const instantiationTime = ((endTime - libraryStart - (libraryEnd - libraryStart)) / 1000).toFixed(1);

    console.log(`Library approach results:`);
    console.log(`- Library initialization: ${libraryTime}s`);
    console.log(`- Created ${result.meshes.length} joist instances in ${instantiationTime}s`);
    console.log(`- Used ${result.uniqueVariantsUsed} unique variants from library`);
    console.log(`- Average instantiation time: ${result.avgInstantiationTime}ms per joist`);
    console.log(`- Total time: ${totalTime}s`);
    
    progressText.innerText = `Complete! ${result.meshes.length} joists (${result.uniqueVariantsUsed} unique variants)`;
    timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${instantiationTime}s | Total: ${totalTime}s`;
    
    // Update final library info
    updateLibraryInfo(stats, result.uniqueVariantsUsed, result.avgInstantiationTime);
    
    // Setup performance monitoring
    if (scene.userData?.renderer) {
      setupPerformanceMonitor(scene.userData.renderer);
    }
    
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