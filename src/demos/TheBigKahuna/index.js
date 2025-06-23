import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import { 
  initializeJoistLibrary, 
  instantiateJoistFromLibrary, 
  getLibraryStats 
} from "./TheBigKahuna.js";
import { setupThreeJSViewport } from "../../common/scene.js";

// Enhanced performance monitoring for the Big Kahuna
function setupPerformanceMonitor(renderer) {
  const fpsElement = document.getElementById("fps");
  const trianglesElement = document.getElementById("triangles");
  const drawCallsElement = document.getElementById("draw-calls");
  const memoryElement = document.getElementById("memory");
  const instantiationElement = document.getElementById("instantiation-speed");
  const gpuMemoryElement = document.getElementById("gpu-memory");
  
  let frameCount = 0;
  let lastTime = performance.now();
  let fpsHistory = [];
  
  function updatePerformanceStats() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      fpsHistory.push(fps);
      if (fpsHistory.length > 10) fpsHistory.shift(); // Keep last 10 readings
      
      const avgFps = Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length);
      fpsElement.textContent = `FPS: ${fps} (avg: ${avgFps})`;
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    // Update render stats
    const info = renderer.info;
    trianglesElement.textContent = `Triangles: ${info.render.triangles.toLocaleString()}`;
    drawCallsElement.textContent = `Draw Calls: ${info.render.calls}`;
    
    // Enhanced memory estimation for Big Kahuna
    const memoryMB = Math.round(info.memory.geometries * 0.2 + info.memory.textures * 0.8);
    memoryElement.textContent = `Memory: ~${memoryMB}MB`;
    
    // GPU memory estimation (rough)
    const gpuMemoryMB = Math.round(info.render.triangles * 0.0001 + info.memory.geometries * 0.5);
    gpuMemoryElement.textContent = `GPU Memory: ~${gpuMemoryMB}MB`;
    
    requestAnimationFrame(updatePerformanceStats);
  }
  
  updatePerformanceStats();
}

// Enhanced library info display for Big Kahuna
function updateLibraryInfo(stats, uniqueJoistCount, avgInstantiationTime) {
  const variantsElement = document.getElementById("library-variants");
  const libraryMemoryElement = document.getElementById("library-memory");
  const librarySpecsElement = document.getElementById("library-specs");
  const libraryDepthsElement = document.getElementById("library-depths");
  const libraryPatternsElement = document.getElementById("library-patterns");
  const uniqueJoistsElement = document.getElementById("unique-joists");
  const instantiationElement = document.getElementById("instantiation-speed");
  
  variantsElement.textContent = `Variants: ${stats.totalVariants}`;
  libraryMemoryElement.textContent = `Library Size: ${stats.memoryFootprint}`;
  librarySpecsElement.textContent = `Length Range: ${stats.lengthRange}`;
  libraryDepthsElement.textContent = `Depth Range: ${stats.depthRange}`;
  libraryPatternsElement.textContent = `Web Patterns: ${stats.webPatterns}`;
  uniqueJoistsElement.textContent = `Unique Instances: ${uniqueJoistCount}`;
  instantiationElement.textContent = `Avg Instantiation: ${avgInstantiationTime}ms`;
}

// Big Kahuna joist creation - 10,000 joists across 10 floors
async function createBigKahunaJoists(scene, progressCallback) {
  const joistsPerBay = 100;
  const numberOfBays = 10;
  const numberOfFloors = 10; // Doubled from original 5 floors
  const joistSpacing = 8 * 12;
  const bayWidth = 48 * 12;
  const storyHeight = 32 * 12;
  const totalJoists = numberOfFloors * numberOfBays * joistsPerBay; // 10,000 joists

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
          metadata: joistData.metadata,
          floor: floorIndex,
          bay: bayIndex,
          joist: joistIndex
        };
        
        scene.add(mesh);
        allMeshes.push(mesh);
        
        joistCount++;
        
        // Update progress less frequently to maintain speed (every 50 joists for Big Kahuna)
        if (joistCount % 50 === 0 || joistCount === totalJoists) {
          if (progressCallback) {
            const percentage = Math.round((joistCount / totalJoists) * 100);
            const avgInstTime = (instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length).toFixed(3);
            const joistsPerSecond = Math.round(1000 / parseFloat(avgInstTime));
            progressCallback(
              `BIG KAHUNA: Instantiating joist ${joistCount.toLocaleString()} of ${totalJoists.toLocaleString()} (${percentage}%) - ${joistsPerSecond}/sec`,
              joistCount,
              totalJoists,
              uniqueVariants.size,
              avgInstTime
            );
          }
          
          // Small yield to prevent browser freezing (reduced for Big Kahuna)
          if (joistCount % 200 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
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

// Main function for The Big Kahuna
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
    progressText.innerText = "🌺 THE BIG KAHUNA: Initializing OpenCascade...";
    const oc = await initOpenCascade();

    progressText.innerText = "🌺 Pre-tessellating 2000-variant joist library...";
    timeInfo.innerText = "Building the ultimate joist library (one-time cost)";
    
    // Initialize the Big Kahuna library (one-time cost, like your C++ startup)
    const libraryStart = performance.now();
    await initializeJoistLibrary(oc);
    const libraryEnd = performance.now();
    const libraryTime = ((libraryEnd - libraryStart) / 1000).toFixed(2);
    
    const stats = getLibraryStats();
    
    progressText.innerText = "🌺 THE BIG KAHUNA: Instantiating 10,000 joists...";
    timeInfo.innerText = `Library loaded in ${libraryTime}s. Now for the ultimate test...`;

    // Create all joists using Big Kahuna approach
    const result = await createBigKahunaJoists(scene, (message, current, total, uniqueCount, avgTime) => {
      progressText.innerText = message;
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      const joistsPerSecond = Math.round(1000 / parseFloat(avgTime));
      timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${elapsed}s | Speed: ${joistsPerSecond} joists/sec`;
      
      // Update library info in real-time
      updateLibraryInfo(stats, uniqueCount, avgTime);
    });

    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    const instantiationTime = ((endTime - libraryStart - (libraryEnd - libraryStart)) / 1000).toFixed(1);
    const joistsPerSecond = Math.round(result.meshes.length / parseFloat(instantiationTime));

    console.log(`🌺 THE BIG KAHUNA RESULTS:`);
    console.log(`- Library initialization: ${libraryTime}s`);
    console.log(`- Created ${result.meshes.length.toLocaleString()} joist instances in ${instantiationTime}s`);
    console.log(`- Used ${result.uniqueVariantsUsed} unique variants from 2000-variant library`);
    console.log(`- Average instantiation time: ${result.avgInstantiationTime}ms per joist`);
    console.log(`- Instantiation speed: ${joistsPerSecond} joists per second`);
    console.log(`- Total time: ${totalTime}s`);
    console.log(`- Final triangle count: ${scene.children.length * 1000} (estimated)`);
    
    progressText.innerText = `🌺 BIG KAHUNA COMPLETE! ${result.meshes.length.toLocaleString()} joists (${result.uniqueVariantsUsed} unique variants)`;
    timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${instantiationTime}s | Total: ${totalTime}s | Speed: ${joistsPerSecond} joists/sec`;
    
    // Update final library info
    updateLibraryInfo(stats, result.uniqueVariantsUsed, result.avgInstantiationTime);
    
    // Setup enhanced performance monitoring for Big Kahuna
    if (scene.userData?.renderer) {
      setupPerformanceMonitor(scene.userData.renderer);
    }
    
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 3000); // Give extra time to admire the Big Kahuna

  } catch (error) {
    console.error("Error in Big Kahuna main:", error);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    progressText.innerText = "🌺 Big Kahuna encountered an error. Check console for details.";
    timeInfo.innerText = `Failed after ${elapsed}s`;
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 3000);
  }
}

main();