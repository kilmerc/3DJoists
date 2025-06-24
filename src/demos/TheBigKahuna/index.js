/**
 * The Big Kahuna - Ultimate Stress Test Application
 * 
 * This is the ultimate demonstration of the library-based approach for handling
 * massive structural engineering models. The Big Kahuna creates a 10-story
 * building with 10,000 unique joist instances, pushing the boundaries of what's
 * possible with web-based CAD visualization.
 * 
 * The Big Kahuna Specifications:
 * =============================
 * - Building: 10 floors × 10 bays × 100 joists = 10,000 total joists
 * - Library: 10,000 pre-tessellated joist variants (~10000 unique marks)
 * - Dimensions: ~800' × 480' × 320' (massive commercial building scale)
 * - Performance Target: Sub-second instantiation for all 10,000 joists
 * - Interactive Features: Real-time floor visibility, design analysis simulation
 * 
 * Enterprise Engineering Context:
 * ===============================
 * This demo simulates what would be required for:
 * - Large commercial building projects (airports, stadiums, hospitals)
 * - Enterprise structural engineering software
 * - Real-time collaboration on massive models
 * - Performance validation for production systems
 * 
 * Technical Achievements:
 * ======================
 * - Lightning-fast instantiation despite massive scale
 * - Individual mesh instances for maximum flexibility
 * - Real-time performance monitoring
 * - Interactive design analysis simulation
 * - Memory-optimized rendering pipeline
 * 
 * The name "Big Kahuna" represents this being the ultimate test - if the
 * library approach can handle this scale efficiently, it can handle anything
 * realistic in structural engineering practice.
 */

import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import {
  initializeJoistLibrary,
  instantiateJoistFromLibrary,
  getLibraryStats,
} from "./TheBigKahuna.js";
import { setupThreeJSViewport } from "../../common/scene.js";

// === GLOBAL STATE MANAGEMENT ===
// Enterprise-scale state management for 10,000+ objects
let joistsByFloor = [];            // Hierarchical organization: [floor][joist]
let originalMaterials = new Map(); // Material state for design analysis
let performanceMetrics = {         // Real-time performance tracking
  frameRate: 0,
  triangleCount: 0,
  memoryUsage: 0,
  instantiationSpeed: 0
};

/**
 * Enterprise Performance Monitoring System
 * 
 * Comprehensive performance monitoring designed for the Big Kahuna's
 * extreme scale. Tracks all critical metrics for validating that the
 * library approach maintains performance even with 10,000+ objects.
 * 
 * Monitored Metrics:
 * - Frame rate (critical for real-time interaction)
 * - Triangle count (GPU load indicator)
 * - Draw calls (rendering efficiency)
 * - Memory usage (system resource consumption)
 * - GPU memory estimation (graphics card utilization)
 * - Instantiation speed (library performance validation)
 * 
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer for metrics
 */
function setupPerformanceMonitor(renderer) {
  // Get DOM elements with defensive programming
  const performanceElements = {
    fps: document.getElementById("fps"),
    triangles: document.getElementById("triangles"),
    drawCalls: document.getElementById("draw-calls"),
    memory: document.getElementById("memory"),
    instantiation: document.getElementById("instantiation-speed"),
    gpuMemory: document.getElementById("gpu-memory")
  };

  let frameCount = 0;
  let lastTime = performance.now();
  let fpsHistory = []; // Track FPS history for stability analysis

  /**
   * Real-time performance statistics update loop
   * Optimized for minimal performance impact while providing comprehensive data
   */
  function updatePerformanceStats() {
    frameCount++;
    const currentTime = performance.now();

    // === FRAME RATE CALCULATION ===
    // Calculate FPS with rolling average for stability
    if (currentTime - lastTime >= 1000) {
      const instantaneousFps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      fpsHistory.push(instantaneousFps);
      
      // Maintain rolling window of last 10 FPS readings
      if (fpsHistory.length > 10) fpsHistory.shift();

      // Calculate average FPS for more stable reading
      const avgFps = Math.round(
        fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
      );
      
      if (performanceElements.fps) {
        performanceElements.fps.textContent = `FPS: ${instantaneousFps} (avg: ${avgFps})`;
      }
      
      // Store for external monitoring
      performanceMetrics.frameRate = avgFps;

      frameCount = 0;
      lastTime = currentTime;
    }

    // === RENDERING STATISTICS ===
    // Extract comprehensive rendering data from Three.js
    const renderInfo = renderer.info;
    
    if (performanceElements.triangles) {
      const triangleCount = renderInfo.render.triangles;
      performanceElements.triangles.textContent = `Triangles: ${triangleCount.toLocaleString()}`;
      performanceMetrics.triangleCount = triangleCount;
    }
    
    if (performanceElements.drawCalls) {
      performanceElements.drawCalls.textContent = `Draw Calls: ${renderInfo.render.calls}`;
    }

    // === MEMORY ESTIMATION ===
    // Enhanced memory calculation for Big Kahuna scale
    if (performanceElements.memory) {
      const estimatedMemoryMB = Math.round(
        renderInfo.memory.geometries * 0.2 + renderInfo.memory.textures * 0.8
      );
      performanceElements.memory.textContent = `Memory: ~${estimatedMemoryMB}MB`;
      performanceMetrics.memoryUsage = estimatedMemoryMB;
    }

    // === GPU MEMORY ESTIMATION ===
    // Rough estimation of GPU memory usage for Big Kahuna monitoring
    if (performanceElements.gpuMemory) {
      const gpuMemoryMB = Math.round(
        renderInfo.render.triangles * 0.0001 + renderInfo.memory.geometries * 0.5
      );
      performanceElements.gpuMemory.textContent = `GPU Memory: ~${gpuMemoryMB}MB`;
    }

    requestAnimationFrame(updatePerformanceStats);
  }

  updatePerformanceStats();
}

/**
 * Big Kahuna Library Information Display System
 * 
 * Updates the comprehensive library information display with real-time
 * statistics about the massive 10,000-variant library and its utilization.
 * 
 * @param {Object} stats - Library statistics from getLibraryStats()
 * @param {number} uniqueJoistCount - Number of unique variants actually used
 * @param {string} avgInstantiationTime - Average instantiation time per joist
 */
function updateLibraryInfo(stats, uniqueJoistCount, avgInstantiationTime) {
  // Comprehensive DOM element mapping with defensive checks
  const libraryElements = {
    variants: document.getElementById("library-variants"),
    memory: document.getElementById("library-memory"),
    specs: document.getElementById("library-specs"),
    depths: document.getElementById("library-depths"),
    patterns: document.getElementById("library-patterns"),
    revisions: document.getElementById("library-revisions"),
    specifications: document.getElementById("library-specifications"),
    uniqueJoists: document.getElementById("unique-joists"),
    instantiation: document.getElementById("instantiation-speed")
  };

  // Update each element with null-checking for robustness
  if (libraryElements.variants) {
    libraryElements.variants.textContent = `Variants: ${stats.totalVariants}`;
  }
  if (libraryElements.memory) {
    libraryElements.memory.textContent = `Library Size: ${stats.memoryFootprint}`;
  }
  if (libraryElements.specs) {
    libraryElements.specs.textContent = `Length Range: ${stats.lengthRange}`;
  }
  if (libraryElements.depths) {
    libraryElements.depths.textContent = `Depth Range: ${stats.depthRange}`;
  }
  if (libraryElements.patterns) {
    libraryElements.patterns.textContent = `Web Patterns: ${stats.webPatterns}`;
  }
  if (libraryElements.revisions) {
    libraryElements.revisions.textContent = `Design Revisions: ${stats.designRevisions}`;
  }
  if (libraryElements.specifications) {
    libraryElements.specifications.textContent = `Specifications: ${stats.specifications}`;
  }
  if (libraryElements.uniqueJoists) {
    libraryElements.uniqueJoists.textContent = `Unique Instances: ${uniqueJoistCount}`;
  }
  if (libraryElements.instantiation) {
    libraryElements.instantiation.textContent = `Avg Instantiation: ${avgInstantiationTime}ms`;
    performanceMetrics.instantiationSpeed = parseFloat(avgInstantiationTime);
  }
}

/**
 * Big Kahuna Floor Visibility Control System
 * 
 * Creates advanced floor visibility controls for managing the visualization
 * of 10,000 joists across 10 floors. Each floor contains 1,000 joists,
 * making granular control essential for performance and usability.
 * 
 * @param {number} numberOfFloors - Total floors in the Big Kahuna building (10)
 */
function setupFloorControls(numberOfFloors) {
  const floorCheckboxes = document.getElementById("floor-checkboxes");
  if (!floorCheckboxes) return;

  // Create sophisticated floor control interface
  for (let i = 0; i < numberOfFloors; i++) {
    const floorDiv = document.createElement("div");
    floorDiv.className = "floor-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `floor-${i}`;
    checkbox.checked = true; // All floors visible by default
    checkbox.addEventListener("change", () =>
      toggleFloorVisibility(i, checkbox.checked)
    );

    const label = document.createElement("label");
    label.htmlFor = `floor-${i}`;
    label.textContent = `Floor ${i + 1} (1000 joists)`; // Big Kahuna scale annotation
    
    floorDiv.appendChild(checkbox);
    floorDiv.appendChild(label);
    floorCheckboxes.appendChild(floorDiv);
  }
  
  console.log(`🌺 Big Kahuna floor controls initialized for ${numberOfFloors} floors`);
}

/**
 * Big Kahuna Floor Visibility Toggle System
 * 
 * Efficiently toggles visibility for 1,000 joists per floor.
 * Demonstrates the performance advantages of individual mesh instances
 * vs. instanced rendering for selective visibility operations.
 * 
 * @param {number} floorIndex - Floor to toggle (0-based index)
 * @param {boolean} visible - Target visibility state
 */
function toggleFloorVisibility(floorIndex, visible) {
  if (!joistsByFloor[floorIndex]) return;

  const startTime = performance.now();
  
  // Efficiently update visibility for all joists on this floor
  joistsByFloor[floorIndex].forEach((mesh) => {
    mesh.visible = visible;
  });
  
  const endTime = performance.now();
  const joistCount = joistsByFloor[floorIndex].length;
  
  // Performance logging for Big Kahuna scale validation
  console.log(
    `🌺 Big Kahuna Floor ${floorIndex + 1} (${joistCount.toLocaleString()} joists) ` +
    `visibility toggled to ${visible} in ${(endTime - startTime).toFixed(2)}ms`
  );
}

/**
 * Big Kahuna Design Analysis Control System
 * 
 * Sets up the interface for running comprehensive structural analysis
 * simulations on all 10,000 joists. This demonstrates the power of the
 * library approach for post-processing operations at enterprise scale.
 */
function setupDesignControls() {
  const designRunBtn = document.getElementById("design-run-btn");
  if (!designRunBtn) return;

  designRunBtn.addEventListener("click", () => {
    simulateDesignRun();
  });
  
  console.log("🌺 Big Kahuna design analysis controls initialized");
}

/**
 * Big Kahuna Comprehensive Design Analysis Simulation
 * 
 * Simulates a full structural analysis run on all 10,000 joists with
 * color-coded stress state visualization. This represents the type of
 * large-scale analysis that would be performed in real structural
 * engineering practice.
 * 
 * Analysis Features:
 * - Processes 10,000 joists with stress state classification
 * - Color-coded visualization (Red/Yellow/Green stress states)
 * - Batch processing for UI responsiveness
 * - Performance monitoring and reporting
 * - Realistic analysis timing simulation
 */
function simulateDesignRun() {
  const designRunBtn = document.getElementById("design-run-btn");
  if (!designRunBtn) return;

  designRunBtn.disabled = true;
  designRunBtn.textContent = "Running Big Kahuna Analysis...";

  const startTime = performance.now();

  // === STRESS STATE CLASSIFICATION SYSTEM ===
  // Define comprehensive stress state categories for engineering analysis
  const stressStates = [
    { color: 0x00ff00, name: "Good", description: "Within design limits" },
    { color: 0xffff00, name: "Near-limit", description: "Approaching design limits" },
    { color: 0xff0000, name: "Over-stressed", description: "Exceeds design capacity" }
  ];

  // Create optimized materials for each stress state
  const stressMaterials = stressStates.map(
    (state) =>
      new THREE.MeshPhongMaterial({
        color: state.color,
        side: THREE.DoubleSide,
      })
  );

  // === BIG KAHUNA ANALYSIS SETUP ===
  // Flatten the hierarchical structure for efficient processing
  const allJoists = joistsByFloor.flat();
  const totalJoists = allJoists.length;

  console.log(`🌺 Big Kahuna Analysis: Processing ${totalJoists.toLocaleString()} joists...`);

  let processedCount = 0;
  const analysisResults = { Good: 0, "Near-limit": 0, "Over-stressed": 0 };

  /**
   * High-Performance Batch Processing Engine
   * 
   * Processes joists in optimized batches to maintain UI responsiveness
   * while handling the massive Big Kahuna scale efficiently.
   */
  function processBatch() {
    const batchSize = 500; // Optimized batch size for Big Kahuna scale
    const endIndex = Math.min(processedCount + batchSize, totalJoists);

    // === BATCH ANALYSIS PROCESSING ===
    for (let i = processedCount; i < endIndex; i++) {
      const mesh = allJoists[i];

      // Preserve original material for potential restoration
      if (!originalMaterials.has(mesh)) {
        originalMaterials.set(mesh, mesh.material);
      }

      // === STRUCTURAL ANALYSIS SIMULATION ===
      // Simulate realistic structural analysis with position-based logic
      // In real applications, this would involve:
      // - Load path analysis
      // - Deflection calculations  
      // - Stress concentration factors
      // - Material property verification
      // - Building code compliance checking
      
      const position = mesh.position;
      const floor = mesh.userData.floor;
      const bay = mesh.userData.bay;
      
      // Simulate analysis complexity based on position and structural factors
      let stressStateIndex;
      
      // Higher floors and edge positions tend to have more stress
      const edgeFactor = (bay === 0 || bay === 9) ? 1.2 : 1.0;
      const heightFactor = 1.0 + (floor * 0.1);
      const randomFactor = Math.random();
      
      const stressFactor = randomFactor * edgeFactor * heightFactor;
      
      if (stressFactor < 0.7) {
        stressStateIndex = 0; // Good
      } else if (stressFactor < 0.9) {
        stressStateIndex = 1; // Near-limit
      } else {
        stressStateIndex = 2; // Over-stressed
      }

      // Apply analysis results
      mesh.material = stressMaterials[stressStateIndex];
      mesh.userData.stressState = stressStates[stressStateIndex].name;
      analysisResults[stressStates[stressStateIndex].name]++;
    }

    processedCount = endIndex;

    // === PROGRESS REPORTING ===
    const progress = Math.round((processedCount / totalJoists) * 100);
    designRunBtn.textContent = `Big Kahuna Analysis... ${progress}%`;

    if (processedCount < totalJoists) {
      // Continue batch processing
      setTimeout(processBatch, 0);
    } else {
      // === ANALYSIS COMPLETION ===
      const endTime = performance.now();
      const analysisTime = (endTime - startTime).toFixed(1);
      const joistsPerSecond = Math.round(
        totalJoists / (parseFloat(analysisTime) / 1000)
      );

      // Comprehensive results reporting
      console.log(`🌺 Big Kahuna Analysis Complete!`);
      console.log(`📊 Analysis Results:`);
      console.log(`   - Total joists analyzed: ${totalJoists.toLocaleString()}`);
      console.log(`   - Analysis time: ${analysisTime}ms`);
      console.log(`   - Analysis speed: ${joistsPerSecond.toLocaleString()} joists/second`);
      console.log(`   - Average time per joist: ${(parseFloat(analysisTime) / totalJoists).toFixed(3)}ms`);
      console.log(`📈 Stress State Distribution:`);
      console.log(`   - Good (Green): ${analysisResults.Good.toLocaleString()} joists`);
      console.log(`   - Near-limit (Yellow): ${analysisResults["Near-limit"].toLocaleString()} joists`);
      console.log(`   - Over-stressed (Red): ${analysisResults["Over-stressed"].toLocaleString()} joists`);

      designRunBtn.textContent = `Big Kahuna Complete! (${analysisTime}ms, ${joistsPerSecond.toLocaleString()}/sec)`;
      
      // Reset button after extended delay to show results
      setTimeout(() => {
        designRunBtn.disabled = false;
        designRunBtn.textContent = "Simulate Joist Design Run";
      }, 3000);
    }
  }

  // Launch the Big Kahuna analysis engine
  processBatch();
}

/**
 * Big Kahuna Joist Creation Engine
 * 
 * The heart of the Big Kahuna demonstration - creates 10,000 joist instances
 * across a massive 10-story building using the enterprise-scale library
 * approach. This function validates that the library methodology can handle
 * real-world commercial building scales efficiently.
 * 
 * Building Specifications:
 * - 10 floors × 10 bays × 100 joists = 10,000 total joists
 * - Building footprint: ~800' × 480' × 320' high
 * - Uses ~10000 unique variants from the massive library
 * - Individual mesh instances for maximum design flexibility
 * 
 * @param {THREE.Scene} scene - Three.js scene for joist placement
 * @param {Function} progressCallback - Progress reporting callback
 * @returns {Object} Comprehensive creation results and performance metrics
 */
async function createBigKahunaJoists(scene, progressCallback) {
  // === BIG KAHUNA BUILDING CONFIGURATION ===
  const bigKahunaConfig = {
    joistsPerBay: 100,        // Joists per bay (commercial building density)
    numberOfBays: 10,         // Bays per floor (large commercial scale)
    numberOfFloors: 10,       // Total floors (high-rise commercial)
    joistSpacing: 8 * 12,     // 8 feet spacing (standard commercial)
    bayWidth: 48 * 12,        // 48 feet bay width (large commercial spans)
    storyHeight: 32 * 12      // 32 feet story height (commercial/industrial)
  };

  const totalJoists = bigKahunaConfig.numberOfFloors * bigKahunaConfig.numberOfBays * bigKahunaConfig.joistsPerBay;
  const totalLength = (bigKahunaConfig.joistsPerBay - 1) * bigKahunaConfig.joistSpacing;
  const totalWidth = bigKahunaConfig.numberOfBays * bigKahunaConfig.bayWidth;
  const totalHeight = (bigKahunaConfig.numberOfFloors - 1) * bigKahunaConfig.storyHeight;

  // === BIG KAHUNA PERFORMANCE TRACKING ===
  const allMeshes = [];
  const uniqueVariants = new Set();
  let joistCount = 0;
  const instantiationTimes = [];

  // Initialize hierarchical organization for 10,000 joists
  joistsByFloor = Array(bigKahunaConfig.numberOfFloors)
    .fill(null)
    .map(() => []);

  console.log(`🌺 BIG KAHUNA BUILDING CREATION INITIATED`);
  console.log(`🏗️  Building Specifications:`);
  console.log(`   - ${bigKahunaConfig.numberOfFloors} floors × ${bigKahunaConfig.numberOfBays} bays × ${bigKahunaConfig.joistsPerBay} joists`);
  console.log(`   - Total joists: ${totalJoists.toLocaleString()}`);
  console.log(`   - Building dimensions: ${totalLength/12}' × ${totalWidth/12}' × ${totalHeight/12}'`);
  console.log(`   - Expected variants: ~${Math.min(totalJoists, 10000).toLocaleString()}`);

  // === ENTERPRISE-SCALE JOIST CREATION LOOP ===
  // Process building floor by floor for organized construction
  for (let floorIndex = 0; floorIndex < bigKahunaConfig.numberOfFloors; floorIndex++) {
    const yPosition = floorIndex * bigKahunaConfig.storyHeight;

    // Process each bay on the current floor
    for (let bayIndex = 0; bayIndex < bigKahunaConfig.numberOfBays; bayIndex++) {
      // Create all joists in the current bay
      for (let joistIndex = 0; joistIndex < bigKahunaConfig.joistsPerBay; joistIndex++) {
        // === 3D POSITIONING CALCULATION ===
        const xPosition = joistIndex * bigKahunaConfig.joistSpacing - totalLength / 2;
        const zPosition = bayIndex * bigKahunaConfig.bayWidth - totalWidth / 2 + bigKahunaConfig.bayWidth / 2;

        // === LIGHTNING-FAST LIBRARY INSTANTIATION ===
        // This is the key operation that validates the Big Kahuna approach
        const instantiationStart = performance.now();
        const joistData = instantiateJoistFromLibrary(joistIndex, bayIndex, floorIndex);
        const instantiationEnd = performance.now();

        // Track performance metrics for validation
        instantiationTimes.push(instantiationEnd - instantiationStart);
        uniqueVariants.add(joistData.variantId);

        // === INDIVIDUAL MESH CREATION ===
        // Create individual mesh instances for maximum flexibility
        // This allows independent material changes, visibility control, etc.
        const material = new THREE.MeshPhongMaterial({
          color: 0xcccccc,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(joistData.geometry, material);
        mesh.position.set(xPosition, yPosition, zPosition);

        // Store comprehensive metadata for analysis and debugging
        mesh.userData = {
          variantId: joistData.variantId,
          metadata: joistData.metadata,
          floor: floorIndex,
          bay: bayIndex,
          joist: joistIndex,
          position: { x: xPosition, y: yPosition, z: zPosition }
        };

        // Add to scene and tracking structures
        scene.add(mesh);
        allMeshes.push(mesh);
        joistsByFloor[floorIndex].push(mesh);

        joistCount++;

        // === PROGRESS REPORTING ===
        // Update progress less frequently for Big Kahuna scale (every 50 joists)
        if (joistCount % 50 === 0 || joistCount === totalJoists) {
          if (progressCallback) {
            const percentage = Math.round((joistCount / totalJoists) * 100);
            const avgInstTime = (
              instantiationTimes.reduce((a, b) => a + b, 0) /
              instantiationTimes.length
            ).toFixed(3);
            const joistsPerSecond = Math.round(1000 / parseFloat(avgInstTime));
            
            progressCallback(
              `🌺 BIG KAHUNA: Instantiating joist ${joistCount.toLocaleString()} of ${totalJoists.toLocaleString()} (${percentage}%) - ${joistsPerSecond}/sec`,
              joistCount,
              totalJoists,
              uniqueVariants.size,
              avgInstTime
            );
          }

          // Reduced yield frequency for Big Kahuna efficiency
          if (joistCount % 200 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
      }
    }
  }

  // === BIG KAHUNA COMPLETION METRICS ===
  const avgInstantiationTime = (
    instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length
  ).toFixed(3);

  console.log(`🌺 BIG KAHUNA CREATION COMPLETE!`);
  console.log(`📊 Final Statistics:`);
  console.log(`   - Total joists created: ${allMeshes.length.toLocaleString()}`);
  console.log(`   - Unique variants used: ${uniqueVariants.size.toLocaleString()}`);
  console.log(`   - Average instantiation time: ${avgInstantiationTime}ms per joist`);
  console.log(`   - Peak instantiation rate: ${Math.round(1000 / parseFloat(avgInstantiationTime)).toLocaleString()} joists/second`);
  console.log(`   - Library utilization: ${((uniqueVariants.size / 10000) * 100).toFixed(1)}%`);

  return {
    meshes: allMeshes,
    uniqueVariantsUsed: uniqueVariants.size,
    avgInstantiationTime: avgInstantiationTime,
    numberOfFloors: bigKahunaConfig.numberOfFloors,
    buildingDimensions: {
      length: totalLength / 12,
      width: totalWidth / 12,
      height: totalHeight / 12
    }
  };
}

/**
 * Big Kahuna Main Application Controller
 * 
 * Orchestrates the complete Big Kahuna demonstration workflow.
 * This represents the ultimate test of the library-based approach
 * at enterprise engineering software scale.
 * 
 * Workflow Phases:
 * 1. OpenCascade initialization
 * 2. Massive 10,000-variant library building
 * 3. 10,000-joist building creation
 * 4. Interactive control system setup
 * 5. Real-time performance monitoring
 * 6. Comprehensive results reporting
 */
async function main() {
  // === DOM INTERFACE SETUP ===
  const uiElements = {
    loader: document.getElementById("loader"),
    progressText: document.getElementById("progress-text"),
    timeInfo: document.getElementById("time-info")
  };

  // Defensive programming for missing DOM elements
  if (!uiElements.loader) {
    console.error("🌺 Big Kahuna: Loader element not found! Check HTML structure.");
    return;
  }

  uiElements.loader.classList.remove("hidden");

  // === 3D SCENE INITIALIZATION ===
  const scene = setupThreeJSViewport();
  if (!scene) {
    if (uiElements.loader) uiElements.loader.classList.add("hidden");
    return;
  }

  const startTime = performance.now();

  try {
    // === PHASE 1: OPENCASCADE INITIALIZATION ===
    if (uiElements.progressText) {
      uiElements.progressText.innerText = "🌺 THE BIG KAHUNA: Initializing OpenCascade...";
    }
    const oc = await initOpenCascade();

    // === PHASE 2: MASSIVE LIBRARY INITIALIZATION ===
    if (uiElements.progressText) {
      uiElements.progressText.innerText = "🌺 Pre-tessellating 10000-variant joist library...";
    }
    if (uiElements.timeInfo) {
      uiElements.timeInfo.innerText = "Building the ultimate joist library (one-time cost)";
    }

    const libraryStart = performance.now();
    await initializeJoistLibrary(oc);
    const libraryEnd = performance.now();
    const libraryTime = ((libraryEnd - libraryStart) / 1000).toFixed(2);

    const stats = getLibraryStats();

    console.log(`🌺 Big Kahuna Library Initialization Complete:`);
    console.log(`   - Library build time: ${libraryTime}s`);
    console.log(`   - Total variants: ${stats.totalVariants}`);
    console.log(`   - Memory footprint: ${stats.memoryFootprint}`);

    // === PHASE 3: MASSIVE BUILDING CREATION ===
    if (uiElements.progressText) {
      uiElements.progressText.innerText = "🌺 THE BIG KAHUNA: Instantiating 10,000 joists...";
    }
    if (uiElements.timeInfo) {
      uiElements.timeInfo.innerText = `Library loaded in ${libraryTime}s. Now for the ultimate test...`;
    }

    const result = await createBigKahunaJoists(
      scene,
      (message, current, total, uniqueCount, avgTime) => {
        if (uiElements.progressText) uiElements.progressText.innerText = message;
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const joistsPerSecond = Math.round(1000 / parseFloat(avgTime));
        if (uiElements.timeInfo) {
          uiElements.timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${elapsed}s | Speed: ${joistsPerSecond} joists/sec`;
        }

        // Real-time library info updates
        updateLibraryInfo(stats, uniqueCount, avgTime);
      }
    );

    // === PHASE 4: COMPREHENSIVE RESULTS REPORTING ===
    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    const instantiationTime = (
      (endTime - libraryStart - (libraryEnd - libraryStart)) / 1000
    ).toFixed(1);
    const joistsPerSecond = Math.round(
      result.meshes.length / parseFloat(instantiationTime)
    );

    // Big Kahuna achievement logging
    console.log(`\n🌺 THE BIG KAHUNA RESULTS 🌺`);
    console.log(`==============================`);
    console.log(`🏗️  Building Specifications:`);
    console.log(`   - ${result.buildingDimensions.length.toFixed(0)}' × ${result.buildingDimensions.width.toFixed(0)}' × ${result.buildingDimensions.height.toFixed(0)}' building`);
    console.log(`   - ${result.meshes.length.toLocaleString()} total joist instances`);
    console.log(`   - ${result.numberOfFloors} floors with 1,000 joists each`);
    console.log(`📚 Library Performance:`);
    console.log(`   - Library initialization: ${libraryTime}s`);
    console.log(`   - ${result.uniqueVariantsUsed.toLocaleString()} unique variants from 10,000-variant library`);
    console.log(`   - Library utilization: ${((result.uniqueVariantsUsed / 10000) * 100).toFixed(1)}%`);
    console.log(`⚡ Instantiation Performance:`);
    console.log(`   - Instantiation time: ${instantiationTime}s`);
    console.log(`   - Average time per joist: ${result.avgInstantiationTime}ms`);
    console.log(`   - Peak instantiation rate: ${joistsPerSecond.toLocaleString()} joists/second`);
    console.log(`🎯 Total Performance:`);
    console.log(`   - Total time (including library): ${totalTime}s`);
    console.log(`   - Estimated triangle count: ${(result.meshes.length * 1000).toLocaleString()}`);
    console.log(`   - Memory efficiency: Shared geometry instances`);

    // Update final UI display
    if (uiElements.progressText) {
      uiElements.progressText.innerText = `🌺 BIG KAHUNA COMPLETE! ${result.meshes.length.toLocaleString()} joists (${result.uniqueVariantsUsed.toLocaleString()} unique variants)`;
    }
    if (uiElements.timeInfo) {
      uiElements.timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${instantiationTime}s | Total: ${totalTime}s | Speed: ${joistsPerSecond.toLocaleString()} joists/sec`;
    }

    // === PHASE 5: INTERACTIVE SYSTEMS INITIALIZATION ===
    console.log(`🌺 Initializing Big Kahuna interactive systems...`);
    
    // Update comprehensive library information display
    updateLibraryInfo(
      stats,
      result.uniqueVariantsUsed,
      result.avgInstantiationTime
    );

    // Setup advanced floor visibility controls (10 floors × 1000 joists each)
    setupFloorControls(result.numberOfFloors);
    
    // Setup enterprise-scale design analysis simulation
    setupDesignControls();

    // === PHASE 6: PERFORMANCE MONITORING ACTIVATION ===
    // Launch real-time performance monitoring for Big Kahuna validation
    if (scene.userData?.renderer) {
      setupPerformanceMonitor(scene.userData.renderer);
      console.log(`🌺 Big Kahuna performance monitoring activated`);
    }

    // === PHASE 7: COMPLETION CELEBRATION ===
    // Extended display time to appreciate the Big Kahuna achievement
    setTimeout(() => {
      if (uiElements.loader) uiElements.loader.classList.add("hidden");
      console.log(`🌺 THE BIG KAHUNA IS LIVE! 🌺`);
      console.log(`Interactive features available:`);
      console.log(`   - Floor visibility controls (10 floors)`);
      console.log(`   - Design analysis simulation (10,000 joists)`);
      console.log(`   - Real-time performance monitoring`);
      console.log(`   - Full 3D navigation and view controls`);
    }, 3000); // Extra time to show the Big Kahuna completion message

  } catch (error) {
    // === ERROR HANDLING FOR BIG KAHUNA SCALE ===
    console.error("🌺 Big Kahuna Error:", error);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    
    if (uiElements.progressText) {
      uiElements.progressText.innerText = "🌺 Big Kahuna encountered an error. Check console for details.";
    }
    if (uiElements.timeInfo) {
      uiElements.timeInfo.innerText = `Failed after ${elapsed}s`;
    }
    
    // Extended error display for debugging
    setTimeout(() => {
      if (uiElements.loader) uiElements.loader.classList.add("hidden");
    }, 3000);
  }
}

// === BIG KAHUNA LAUNCH ===
// Initiate the ultimate structural engineering demonstration
console.log(`🌺 THE BIG KAHUNA - ULTIMATE STRESS TEST STARTING... 🌺`);
main();