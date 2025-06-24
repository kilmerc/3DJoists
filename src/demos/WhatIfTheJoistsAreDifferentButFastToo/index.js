/**
 * Fast Library-Based Joist Demo - Main Application
 * 
 * This demo showcases a production-ready approach for handling thousands of
 * unique structural elements efficiently. It demonstrates the power of 
 * pre-computation and library-based instantiation.
 * 
 * Demo Specifications:
 * - 5 floors × 10 bays × 100 joists = 5,000 total joists
 * - 1,000 unique joist variants from pre-tessellated library
 * - Real-time floor visibility controls
 * - Design analysis simulation with color-coded stress states
 * - Performance monitoring
 * 
 * Key Performance Features:
 * - Library initialization: One-time cost (simulates C++ startup)
 * - Joist instantiation: ~0.1ms per joist (memory lookup only)
 * - Interactive controls: Floor visibility, design analysis
 * - GPU-optimized rendering: Individual meshes for design flexibility
 */

import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import { 
  initializeJoistLibrary, 
  instantiateJoistFromLibrary, 
  getLibraryStats 
} from "./WhatIfTheJoistsAreDifferentButFastToo.js";
import { setupThreeJSViewport } from "../../common/scene.js";

// === GLOBAL STATE MANAGEMENT ===
// Organized storage for building components and interaction state
let joistsByFloor = [];        // Array of arrays: joistsByFloor[floor][joist]
let originalMaterials = new Map(); // Store original materials for design simulation

/**
 * Performance Monitoring System
 * 
 * Tracks real-time rendering performance metrics including FPS,
 * triangle count, draw calls, and memory usage. Essential for
 * validating the efficiency of the library-based approach.
 * 
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer instance
 */
function setupPerformanceMonitor(renderer) {
  // Get DOM elements for displaying performance data
  const fpsElement = document.getElementById("fps");
  const trianglesElement = document.getElementById("triangles");
  const drawCallsElement = document.getElementById("draw-calls");
  const memoryElement = document.getElementById("memory");
  const instantiationElement = document.getElementById("instantiation-speed");
  
  let frameCount = 0;
  let lastTime = performance.now();
  
  /**
   * Updates performance statistics display
   * Called every animation frame to provide real-time feedback
   */
  function updatePerformanceStats() {
    frameCount++;
    const currentTime = performance.now();
    
    // Calculate FPS every second
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      if (fpsElement) fpsElement.textContent = `FPS: ${fps}`;
      frameCount = 0;
      lastTime = currentTime;
    }
    
    // Update render statistics from Three.js
    const info = renderer.info;
    if (trianglesElement) {
      trianglesElement.textContent = `Triangles: ${info.render.triangles.toLocaleString()}`;
    }
    if (drawCallsElement) {
      drawCallsElement.textContent = `Draw Calls: ${info.render.calls}`;
    }
    
    // Estimate memory usage (rough calculation)
    if (memoryElement) {
      const memoryMB = Math.round(info.memory.geometries * 0.1 + info.memory.textures * 0.5);
      memoryElement.textContent = `Memory: ~${memoryMB}MB`;
    }
    
    requestAnimationFrame(updatePerformanceStats);
  }
  
  updatePerformanceStats();
}

/**
 * Updates Library Information Display
 * 
 * Shows comprehensive information about the joist library including
 * variant count, memory usage, and instantiation performance.
 * 
 * @param {Object} stats - Library statistics from getLibraryStats()
 * @param {number} uniqueJoistCount - Number of unique variants actually used
 * @param {string} avgInstantiationTime - Average time per joist instantiation
 */
function updateLibraryInfo(stats, uniqueJoistCount, avgInstantiationTime) {
  // Get DOM elements with defensive programming
  const elements = {
    variants: document.getElementById("library-variants"),
    memory: document.getElementById("library-memory"),
    specs: document.getElementById("library-specs"),
    uniqueJoists: document.getElementById("unique-joists"),
    instantiation: document.getElementById("instantiation-speed")
  };
  
  // Update each element if it exists
  if (elements.variants) {
    elements.variants.textContent = `Variants: ${stats.totalVariants}`;
  }
  if (elements.memory) {
    elements.memory.textContent = `Library Size: ${stats.memoryFootprint}`;
  }
  if (elements.specs) {
    elements.specs.textContent = `Specs: ${stats.lengthRange}, ${stats.depthRange}`;
  }
  if (elements.uniqueJoists) {
    elements.uniqueJoists.textContent = `Unique Instances: ${uniqueJoistCount}`;
  }
  if (elements.instantiation) {
    elements.instantiation.textContent = `Avg Instantiation: ${avgInstantiationTime}ms`;
  }
}

/**
 * Floor Visibility Control System
 * 
 * Creates interactive checkboxes for each floor, allowing users to
 * show/hide individual floors. Demonstrates the flexibility of using
 * individual mesh instances rather than instanced rendering.
 * 
 * @param {number} numberOfFloors - Total number of floors in the building
 */
function setupFloorControls(numberOfFloors) {
  const floorCheckboxes = document.getElementById("floor-checkboxes");
  if (!floorCheckboxes) return;
  
  // Create checkbox for each floor
  for (let i = 0; i < numberOfFloors; i++) {
    const floorDiv = document.createElement("div");
    floorDiv.className = "floor-checkbox";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `floor-${i}`;
    checkbox.checked = true; // All floors visible by default
    checkbox.addEventListener("change", () => toggleFloorVisibility(i, checkbox.checked));
    
    const label = document.createElement("label");
    label.htmlFor = `floor-${i}`;
    label.textContent = `Floor ${i + 1}`;
    
    floorDiv.appendChild(checkbox);
    floorDiv.appendChild(label);
    floorCheckboxes.appendChild(floorDiv);
  }
}

/**
 * Toggles visibility of all joists on a specific floor
 * 
 * Demonstrates the advantage of individual meshes - we can easily
 * show/hide groups of objects without affecting rendering performance
 * of visible objects.
 * 
 * @param {number} floorIndex - Floor index (0-based)
 * @param {boolean} visible - Whether floor should be visible
 */
function toggleFloorVisibility(floorIndex, visible) {
  if (!joistsByFloor[floorIndex]) return;
  
  const startTime = performance.now();
  
  // Toggle visibility for all joists on this floor
  joistsByFloor[floorIndex].forEach(mesh => {
    mesh.visible = visible;
  });
  
  const endTime = performance.now();
  const joistCount = joistsByFloor[floorIndex].length;
  
  console.log(
    `Floor ${floorIndex + 1} (${joistCount} joists) visibility toggled to ${visible} in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * Design Analysis Control System
 * 
 * Sets up the interface for running design analysis simulations.
 * This demonstrates how the library approach enables post-processing
 * operations on large numbers of structural elements.
 */
function setupDesignControls() {
  const designRunBtn = document.getElementById("design-run-btn");
  if (!designRunBtn) return;
  
  designRunBtn.addEventListener("click", () => {
    simulateDesignRun();
  });
}

/**
 * Design Analysis Simulation
 * 
 * Simulates a structural analysis run that evaluates all joists and
 * color-codes them based on stress state. This demonstrates:
 * - Processing thousands of elements efficiently
 * - Visual feedback for engineering analysis
 * - Batch processing to maintain UI responsiveness
 */
function simulateDesignRun() {
  const designRunBtn = document.getElementById("design-run-btn");
  if (!designRunBtn) return;
  
  designRunBtn.disabled = true;
  designRunBtn.textContent = "Running Design Analysis...";
  
  const startTime = performance.now();
  
  // === STRESS STATE DEFINITIONS ===
  // Define color-coded stress states for visualization
  const stressStates = [
    { color: 0x00ff00, name: "Good" },        // Green - within design limits
    { color: 0xffff00, name: "Near-limit" }, // Yellow - approaching limits
    { color: 0xff0000, name: "Over-stressed" } // Red - exceeds design limits
  ];
  
  // Create materials for each stress state
  const stressMaterials = stressStates.map(state => 
    new THREE.MeshPhongMaterial({
      color: state.color,
      side: THREE.DoubleSide
    })
  );
  
  // === BATCH PROCESSING SETUP ===
  let processedCount = 0;
  const allJoists = joistsByFloor.flat(); // Flatten all floors into single array
  const totalJoists = allJoists.length;
  
  console.log(`Starting design analysis for ${totalJoists} joists...`);
  
  /**
   * Processes joists in batches to prevent UI freezing
   * Large batch sizes are possible because we're only changing materials,
   * not doing complex geometric operations
   */
  function processBatch() {
    const batchSize = 200; // Process 200 joists per batch
    const endIndex = Math.min(processedCount + batchSize, totalJoists);
    
    // Process current batch
    for (let i = processedCount; i < endIndex; i++) {
      const mesh = allJoists[i];
      
      // Store original material for potential restoration
      if (!originalMaterials.has(mesh)) {
        originalMaterials.set(mesh, mesh.material);
      }
      
      // Simulate structural analysis result
      // In reality, this would be based on actual load calculations
      const stressStateIndex = Math.floor(Math.random() * stressStates.length);
      mesh.material = stressMaterials[stressStateIndex];
      mesh.userData.stressState = stressStates[stressStateIndex].name;
    }
    
    processedCount = endIndex;
    
    // Update progress display
    const progress = Math.round((processedCount / totalJoists) * 100);
    designRunBtn.textContent = `Analyzing... ${progress}%`;
    
    if (processedCount < totalJoists) {
      // Continue processing in next frame
      setTimeout(processBatch, 0);
    } else {
      // Analysis complete
      const endTime = performance.now();
      const analysisTime = (endTime - startTime).toFixed(1);
      const joistsPerSecond = Math.round(totalJoists / (parseFloat(analysisTime) / 1000));
      
      console.log(`Design analysis complete:`);
      console.log(`- ${totalJoists} joists analyzed in ${analysisTime}ms`);
      console.log(`- Average time per joist: ${(parseFloat(analysisTime) / totalJoists).toFixed(3)}ms`);
      console.log(`- Analysis speed: ${joistsPerSecond.toLocaleString()} joists per second`);
      
      designRunBtn.textContent = `Analysis Complete (${analysisTime}ms)`;
      
      // Reset button after delay
      setTimeout(() => {
        designRunBtn.disabled = false;
        designRunBtn.textContent = "Simulate Joist Design Run";
      }, 2000);
    }
  }
  
  // Start batch processing
  processBatch();
}

/**
 * Fast Joist Creation Using Library Approach
 * 
 * Creates thousands of joist instances using the pre-tessellated library.
 * This function demonstrates the key advantage of the library approach:
 * regardless of geometric complexity, instantiation is just a fast lookup.
 * 
 * @param {THREE.Scene} scene - Three.js scene to add joists to
 * @param {Function} progressCallback - Progress update callback
 * @returns {Object} Creation results and statistics
 */
async function createJoistsFromLibrary(scene, progressCallback) {
  // === BUILDING PARAMETERS ===
  const buildingConfig = {
    joistsPerBay: 100,
    numberOfBays: 10,
    numberOfFloors: 5,
    joistSpacing: 8 * 12,      // 8 feet in inches
    bayWidth: 48 * 12,         // 48 feet in inches
    storyHeight: 32 * 12       // 32 feet in inches
  };
  
  const totalJoists = buildingConfig.numberOfFloors * buildingConfig.numberOfBays * buildingConfig.joistsPerBay;
  const totalLength = (buildingConfig.joistsPerBay - 1) * buildingConfig.joistSpacing;
  const totalWidth = buildingConfig.numberOfBays * buildingConfig.bayWidth;

  // === TRACKING VARIABLES ===
  const allMeshes = [];
  const uniqueVariants = new Set(); // Track which variants are actually used
  let joistCount = 0;
  const instantiationTimes = []; // Track performance of each instantiation

  // Initialize floor-based organization
  joistsByFloor = Array(buildingConfig.numberOfFloors).fill(null).map(() => []);

  // === SHARED MATERIAL ===
  // Use shared material for optimization (can be changed per-mesh later)
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
  });

  console.log(`Creating ${totalJoists.toLocaleString()} joists from library...`);
  console.log(`Building dimensions: ${totalLength/12}' × ${totalWidth/12}' × ${(buildingConfig.numberOfFloors * buildingConfig.storyHeight)/12}'`);

  // === JOIST CREATION LOOP ===
  // Create joists floor by floor, bay by bay
  for (let floorIndex = 0; floorIndex < buildingConfig.numberOfFloors; floorIndex++) {
    const yPosition = floorIndex * buildingConfig.storyHeight;
    
    for (let bayIndex = 0; bayIndex < buildingConfig.numberOfBays; bayIndex++) {
      for (let joistIndex = 0; joistIndex < buildingConfig.joistsPerBay; joistIndex++) {
        // Calculate 3D position
        const xPosition = joistIndex * buildingConfig.joistSpacing - totalLength / 2;
        const zPosition = bayIndex * buildingConfig.bayWidth - totalWidth / 2 + buildingConfig.bayWidth / 2;

        // === FAST LIBRARY INSTANTIATION ===
        // This is the key operation - fast lookup from pre-computed library
        const instantiationStart = performance.now();
        const joistData = instantiateJoistFromLibrary(joistIndex, bayIndex, floorIndex);
        const instantiationEnd = performance.now();
        
        // Track performance and variant usage
        instantiationTimes.push(instantiationEnd - instantiationStart);
        uniqueVariants.add(joistData.variantId);

        // === MESH CREATION ===
        // Create individual mesh using pre-tessellated geometry
        // Individual meshes allow for independent material changes (design analysis)
        const individualMaterial = baseMaterial.clone();
        const mesh = new THREE.Mesh(joistData.geometry, individualMaterial);
        mesh.position.set(xPosition, yPosition, zPosition);
        
        // Store metadata for analysis and debugging
        mesh.userData = {
          variantId: joistData.variantId,
          metadata: joistData.metadata,
          floor: floorIndex,
          bay: bayIndex,
          joist: joistIndex
        };
        
        // Add to scene and tracking arrays
        scene.add(mesh);
        allMeshes.push(mesh);
        joistsByFloor[floorIndex].push(mesh);
        
        joistCount++;
        
        // === PROGRESS REPORTING ===
        // Update progress periodically to avoid UI blocking
        if (joistCount % 100 === 0 || joistCount === totalJoists) {
          if (progressCallback) {
            const percentage = Math.round((joistCount / totalJoists) * 100);
            const avgInstTime = (instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length).toFixed(3);
            const joistsPerSecond = Math.round(1000 / parseFloat(avgInstTime));
            
            progressCallback(
              `Instantiating joist ${joistCount.toLocaleString()} of ${totalJoists.toLocaleString()} (${percentage}%) - ${joistsPerSecond}/sec`,
              joistCount,
              totalJoists,
              uniqueVariants.size,
              avgInstTime
            );
          }
          
          // Yield to browser to maintain responsiveness
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
  }

  // === CALCULATE FINAL STATISTICS ===
  const avgInstantiationTime = (instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length).toFixed(3);
  
  console.log(`Joist creation complete:`);
  console.log(`- Created ${allMeshes.length.toLocaleString()} joist instances`);
  console.log(`- Used ${uniqueVariants.size} unique variants from 1000-variant library`);
  console.log(`- Average instantiation time: ${avgInstantiationTime}ms per joist`);
  console.log(`- Instantiation speed: ${Math.round(1000 / parseFloat(avgInstantiationTime))} joists per second`);
  
  return {
    meshes: allMeshes,
    uniqueVariantsUsed: uniqueVariants.size,
    avgInstantiationTime: avgInstantiationTime,
    numberOfFloors: buildingConfig.numberOfFloors
  };
}

/**
 * Main Application Entry Point
 * 
 * Orchestrates the entire demo workflow:
 * 1. Initialize OpenCascade and Three.js
 * 2. Build joist library (one-time cost)
 * 3. Create building with thousands of joists
 * 4. Set up interactive controls
 * 5. Start performance monitoring
 */
async function main() {
  // === DOM ELEMENT SETUP ===
  const loader = document.getElementById("loader");
  const progressText = document.getElementById("progress-text");
  const timeInfo = document.getElementById("time-info");
  
  if (!loader) {
    console.error("Loader element not found! Check HTML structure.");
    return;
  }
  
  loader.classList.remove("hidden");

  // === 3D SCENE SETUP ===
  const scene = setupThreeJSViewport();
  if (!scene) {
    if (loader) loader.classList.add("hidden");
    return;
  }

  const startTime = performance.now();

  try {
    // === PHASE 1: OPENCASCADE INITIALIZATION ===
    if (progressText) progressText.innerText = "Initializing OpenCascade...";
    const oc = await initOpenCascade();

    // === PHASE 2: LIBRARY INITIALIZATION ===
    if (progressText) progressText.innerText = "Pre-tessellating joist library...";
    if (timeInfo) timeInfo.innerText = "This one-time cost simulates your C++ library initialization";
    
    const libraryStart = performance.now();
    await initializeJoistLibrary(oc);
    const libraryEnd = performance.now();
    const libraryTime = ((libraryEnd - libraryStart) / 1000).toFixed(2);
    
    const stats = getLibraryStats();
    
    // === PHASE 3: JOIST INSTANTIATION ===
    if (progressText) progressText.innerText = "Instantiating 5000 unique joists from library...";
    if (timeInfo) timeInfo.innerText = `Library loaded in ${libraryTime}s. Now instantiating...`;

    const result = await createJoistsFromLibrary(scene, (message, current, total, uniqueCount, avgTime) => {
      if (progressText) progressText.innerText = message;
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      if (timeInfo) timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${elapsed}s | Avg: ${avgTime}ms per joist`;
      
      // Update library info in real-time
      updateLibraryInfo(stats, uniqueCount, avgTime);
    });

    // === PHASE 4: COMPLETION REPORTING ===
    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    const instantiationTime = ((endTime - libraryStart - (libraryEnd - libraryStart)) / 1000).toFixed(1);
    const joistsPerSecond = Math.round(result.meshes.length / parseFloat(instantiationTime));

    console.log(`\n=== LIBRARY APPROACH RESULTS ===`);
    console.log(`Library initialization: ${libraryTime}s`);
    console.log(`Created ${result.meshes.length.toLocaleString()} joist instances in ${instantiationTime}s`);
    console.log(`Used ${result.uniqueVariantsUsed} unique variants from 1000-variant library`);
    console.log(`Average instantiation time: ${result.avgInstantiationTime}ms per joist`);
    console.log(`Instantiation speed: ${joistsPerSecond.toLocaleString()} joists per second`);
    console.log(`Total time: ${totalTime}s`);
    
    if (progressText) {
      progressText.innerText = `Complete! ${result.meshes.length.toLocaleString()} joists (${result.uniqueVariantsUsed} unique variants)`;
    }
    if (timeInfo) {
      timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${instantiationTime}s | Total: ${totalTime}s`;
    }
    
    // === PHASE 5: INTERACTIVE CONTROLS SETUP ===
    updateLibraryInfo(stats, result.uniqueVariantsUsed, result.avgInstantiationTime);
    setupFloorControls(result.numberOfFloors);
    setupDesignControls();
    
    // === PHASE 6: PERFORMANCE MONITORING ===
    if (scene.userData?.renderer) {
      setupPerformanceMonitor(scene.userData.renderer);
    }
    
    // Hide loader after brief delay to show completion message
    setTimeout(() => {
      if (loader) loader.classList.add("hidden");
    }, 2000);

  } catch (error) {
    console.error("Error in main application:", error);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    if (progressText) progressText.innerText = "Error occurred. Check console for details.";
    if (timeInfo) timeInfo.innerText = `Failed after ${elapsed}s`;
    setTimeout(() => {
      if (loader) loader.classList.add("hidden");
    }, 2000);
  }
}

// Start the application
main();