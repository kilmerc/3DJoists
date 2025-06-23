import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import {
  initializeJoistLibrary,
  instantiateJoistFromLibrary,
  getLibraryStats,
} from "./TheBigKahuna.js";
import { setupThreeJSViewport } from "../../common/scene.js";

// Global state for floor management and design simulation
let joistsByFloor = []; // Array of arrays: joistsByFloor[floor][joist]
let originalMaterials = new Map(); // Store original materials for design simulation

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

      const avgFps = Math.round(
        fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length
      );
      fpsElement.textContent = `FPS: ${fps} (avg: ${avgFps})`;

      frameCount = 0;
      lastTime = currentTime;
    }

    // Update render stats
    const info = renderer.info;
    trianglesElement.textContent = `Triangles: ${info.render.triangles.toLocaleString()}`;
    drawCallsElement.textContent = `Draw Calls: ${info.render.calls}`;

    // Enhanced memory estimation for Big Kahuna
    const memoryMB = Math.round(
      info.memory.geometries * 0.2 + info.memory.textures * 0.8
    );
    memoryElement.textContent = `Memory: ~${memoryMB}MB`;

    // GPU memory estimation (rough)
    const gpuMemoryMB = Math.round(
      info.render.triangles * 0.0001 + info.memory.geometries * 0.5
    );
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
  const libraryRevisionsElement = document.getElementById("library-revisions");
  const librarySpecificationsElement = document.getElementById(
    "library-specifications"
  );
  const uniqueJoistsElement = document.getElementById("unique-joists");
  const instantiationElement = document.getElementById("instantiation-speed");

  // Defensive programming - check if elements exist before updating
  if (variantsElement)
    variantsElement.textContent = `Variants: ${stats.totalVariants}`;
  if (libraryMemoryElement)
    libraryMemoryElement.textContent = `Library Size: ${stats.memoryFootprint}`;
  if (librarySpecsElement)
    librarySpecsElement.textContent = `Length Range: ${stats.lengthRange}`;
  if (libraryDepthsElement)
    libraryDepthsElement.textContent = `Depth Range: ${stats.depthRange}`;
  if (libraryPatternsElement)
    libraryPatternsElement.textContent = `Web Patterns: ${stats.webPatterns}`;
  if (libraryRevisionsElement)
    libraryRevisionsElement.textContent = `Design Revisions: ${stats.designRevisions}`;
  if (librarySpecificationsElement)
    librarySpecificationsElement.textContent = `Specifications: ${stats.specifications}`;
  if (uniqueJoistsElement)
    uniqueJoistsElement.textContent = `Unique Instances: ${uniqueJoistCount}`;
  if (instantiationElement)
    instantiationElement.textContent = `Avg Instantiation: ${avgInstantiationTime}ms`;
}

// Setup floor visibility controls for Big Kahuna (10 floors)
function setupFloorControls(numberOfFloors) {
  const floorCheckboxes = document.getElementById("floor-checkboxes");

  for (let i = 0; i < numberOfFloors; i++) {
    const floorDiv = document.createElement("div");
    floorDiv.className = "floor-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `floor-${i}`;
    checkbox.checked = true;
    checkbox.addEventListener("change", () =>
      toggleFloorVisibility(i, checkbox.checked)
    );

    const label = document.createElement("label");
    label.htmlFor = `floor-${i}`;
    label.textContent = `Floor ${i + 1} (1000 joists)`;

    floorDiv.appendChild(checkbox);
    floorDiv.appendChild(label);
    floorCheckboxes.appendChild(floorDiv);
  }
}

// Toggle floor visibility with Big Kahuna scale
function toggleFloorVisibility(floorIndex, visible) {
  if (joistsByFloor[floorIndex]) {
    const startTime = performance.now();
    joistsByFloor[floorIndex].forEach((mesh) => {
      mesh.visible = visible;
    });
    const endTime = performance.now();
    const joistCount = joistsByFloor[floorIndex].length;
    console.log(
      `Big Kahuna Floor ${
        floorIndex + 1
      } (${joistCount} joists) visibility toggled to ${visible} in ${(
        endTime - startTime
      ).toFixed(2)}ms`
    );
  }
}

// Setup design run simulation for Big Kahuna
function setupDesignControls() {
  const designRunBtn = document.getElementById("design-run-btn");

  designRunBtn.addEventListener("click", () => {
    simulateDesignRun();
  });
}

// Simulate Big Kahuna design run with color changes (10,000 joists)
function simulateDesignRun() {
  const designRunBtn = document.getElementById("design-run-btn");
  designRunBtn.disabled = true;
  designRunBtn.textContent = "Running Big Kahuna Analysis...";

  const startTime = performance.now();

  // Define stress state colors
  const stressStates = [
    { color: 0x00ff00, name: "Good" }, // Green - within limits
    { color: 0xffff00, name: "Near-limit" }, // Yellow - approaching limits
    { color: 0xff0000, name: "Over-stressed" }, // Red - over-stressed
  ];

  // Create materials for each stress state if they don't exist
  const stressMaterials = stressStates.map(
    (state) =>
      new THREE.MeshPhongMaterial({
        color: state.color,
        side: THREE.DoubleSide,
      })
  );

  // Flatten all joists into a single array for easier processing
  const allJoists = joistsByFloor.flat();
  const totalJoists = allJoists.length;
  
  console.log(`Processing ${totalJoists} joists for stress analysis...`);

  let processedCount = 0;

  // Process joists in batches for Big Kahuna efficiency
  function processBatch() {
    const batchSize = 500; // Larger batches for Big Kahuna
    const endIndex = Math.min(processedCount + batchSize, totalJoists);

    // Process this batch
    for (let i = processedCount; i < endIndex; i++) {
      const mesh = allJoists[i];

      // Store original material if not already stored
      if (!originalMaterials.has(mesh)) {
        originalMaterials.set(mesh, mesh.material);
      }

      // Randomly assign stress state (simulate real analysis results)
      const stressStateIndex = Math.floor(Math.random() * stressStates.length);
      mesh.material = stressMaterials[stressStateIndex];
      mesh.userData.stressState = stressStates[stressStateIndex].name;
    }

    processedCount = endIndex;

    // Update button text with progress
    const progress = Math.round((processedCount / totalJoists) * 100);
    designRunBtn.textContent = `Big Kahuna Analysis... ${progress}%`;

    if (processedCount < totalJoists) {
      // Continue processing
      setTimeout(processBatch, 0);
    } else {
      // Complete
      const endTime = performance.now();
      const analysisTime = (endTime - startTime).toFixed(1);
      const joistsPerSecond = Math.round(
        totalJoists / (parseFloat(analysisTime) / 1000)
      );

      console.log(
        `Big Kahuna design analysis complete: ${totalJoists.toLocaleString()} joists analyzed in ${analysisTime}ms`
      );
      console.log(
        `Average time per joist: ${(
          parseFloat(analysisTime) / totalJoists
        ).toFixed(3)}ms`
      );
      console.log(
        `Analysis speed: ${joistsPerSecond.toLocaleString()} joists per second`
      );

      // Log color distribution for verification
      const colorCounts = { Good: 0, "Near-limit": 0, "Over-stressed": 0 };
      allJoists.forEach(mesh => {
        if (mesh.userData.stressState) {
          colorCounts[mesh.userData.stressState]++;
        }
      });
      console.log(`Color distribution:`, colorCounts);

      designRunBtn.textContent = `Big Kahuna Complete! (${analysisTime}ms, ${joistsPerSecond.toLocaleString()}/sec)`;
      setTimeout(() => {
        designRunBtn.disabled = false;
        designRunBtn.textContent = "Simulate Joist Design Run";
      }, 3000);
    }
  }

  // Start batch processing
  processBatch();
}

// Big Kahuna joist creation - 10,000 joists across 10 floors
async function createBigKahunaJoists(scene, progressCallback) {
  const joistsPerBay = 100;
  const numberOfBays = 10;
  const numberOfFloors = 10; // Big Kahuna: 10 floors
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

  // Initialize floor arrays
  joistsByFloor = Array(numberOfFloors)
    .fill(null)
    .map(() => []);

  // Create joists floor by floor
  for (let floorIndex = 0; floorIndex < numberOfFloors; floorIndex++) {
    const yPosition = floorIndex * storyHeight;

    for (let bayIndex = 0; bayIndex < numberOfBays; bayIndex++) {
      for (let joistIndex = 0; joistIndex < joistsPerBay; joistIndex++) {
        const xPosition = joistIndex * joistSpacing - totalLength / 2;
        const zPosition = bayIndex * bayWidth - totalWidth / 2 + bayWidth / 2;

        // Fast instantiation from library (simulates your C++ library call)
        const instantiationStart = performance.now();
        const joistData = instantiateJoistFromLibrary(
          joistIndex,
          bayIndex,
          floorIndex
        );
        const instantiationEnd = performance.now();

        instantiationTimes.push(instantiationEnd - instantiationStart);
        uniqueVariants.add(joistData.variantId);

        // Create INDIVIDUAL material for each mesh
        const material = new THREE.MeshPhongMaterial({
          color: 0xcccccc,
          side: THREE.DoubleSide,
        });

        // Create mesh using pre-tessellated geometry
        const mesh = new THREE.Mesh(joistData.geometry, material);
        mesh.position.set(xPosition, yPosition, zPosition);
        mesh.userData = {
          variantId: joistData.variantId,
          metadata: joistData.metadata,
          floor: floorIndex,
          bay: bayIndex,
          joist: joistIndex,
        };

        scene.add(mesh);
        allMeshes.push(mesh);
        joistsByFloor[floorIndex].push(mesh);

        joistCount++;

        // Update progress less frequently to maintain speed (every 50 joists for Big Kahuna)
        if (joistCount % 50 === 0 || joistCount === totalJoists) {
          if (progressCallback) {
            const percentage = Math.round((joistCount / totalJoists) * 100);
            const avgInstTime = (
              instantiationTimes.reduce((a, b) => a + b, 0) /
              instantiationTimes.length
            ).toFixed(3);
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
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        }
      }
    }
  }

  const avgInstantiationTime = (
    instantiationTimes.reduce((a, b) => a + b, 0) / instantiationTimes.length
  ).toFixed(3);

  return {
    meshes: allMeshes,
    uniqueVariantsUsed: uniqueVariants.size,
    avgInstantiationTime: avgInstantiationTime,
    numberOfFloors: numberOfFloors,
  };
}

// Main function for The Big Kahuna
async function main() {
  const loader = document.getElementById("loader");
  const progressText = document.getElementById("progress-text");
  const timeInfo = document.getElementById("time-info");

  // Defensive programming - check if loader exists
  if (!loader) {
    console.error("Loader element not found! Check HTML structure.");
    return;
  }

  loader.classList.remove("hidden");

  const scene = setupThreeJSViewport();
  if (!scene) {
    if (loader) loader.classList.add("hidden");
    return;
  }

  const startTime = performance.now();

  try {
    if (progressText)
      progressText.innerText = "🌺 THE BIG KAHUNA: Initializing OpenCascade...";
    const oc = await initOpenCascade();

    if (progressText)
      progressText.innerText =
        "🌺 Pre-tessellating 10000-variant joist library...";
    if (timeInfo)
      timeInfo.innerText =
        "Building the ultimate joist library (one-time cost)";

    // Initialize the Big Kahuna library (one-time cost, like your C++ startup)
    const libraryStart = performance.now();
    await initializeJoistLibrary(oc);
    const libraryEnd = performance.now();
    const libraryTime = ((libraryEnd - libraryStart) / 1000).toFixed(2);

    const stats = getLibraryStats();

    if (progressText)
      progressText.innerText =
        "🌺 THE BIG KAHUNA: Instantiating 10,000 joists...";
    if (timeInfo)
      timeInfo.innerText = `Library loaded in ${libraryTime}s. Now for the ultimate test...`;

    // Create all joists using Big Kahuna approach
    const result = await createBigKahunaJoists(
      scene,
      (message, current, total, uniqueCount, avgTime) => {
        if (progressText) progressText.innerText = message;
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const joistsPerSecond = Math.round(1000 / parseFloat(avgTime));
        if (timeInfo)
          timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${elapsed}s | Speed: ${joistsPerSecond} joists/sec`;

        // Update library info in real-time
        updateLibraryInfo(stats, uniqueCount, avgTime);
      }
    );

    const endTime = performance.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    const instantiationTime = (
      (endTime - libraryStart - (libraryEnd - libraryStart)) /
      1000
    ).toFixed(1);
    const joistsPerSecond = Math.round(
      result.meshes.length / parseFloat(instantiationTime)
    );

    console.log(`🌺 THE BIG KAHUNA RESULTS:`);
    console.log(`- Library initialization: ${libraryTime}s`);
    console.log(
      `- Created ${result.meshes.length.toLocaleString()} joist instances in ${instantiationTime}s`
    );
    console.log(
      `- Used ${result.uniqueVariantsUsed} unique variants from 10000-variant library`
    );
    console.log(
      `- Average instantiation time: ${result.avgInstantiationTime}ms per joist`
    );
    console.log(`- Instantiation speed: ${joistsPerSecond} joists per second`);
    console.log(`- Total time: ${totalTime}s`);
    console.log(
      `- Final triangle count: ${scene.children.length * 1000} (estimated)`
    );

    if (progressText)
      progressText.innerText = `🌺 BIG KAHUNA COMPLETE! ${result.meshes.length.toLocaleString()} joists (${
        result.uniqueVariantsUsed
      } unique variants)`;
    if (timeInfo)
      timeInfo.innerText = `Library: ${libraryTime}s | Instantiation: ${instantiationTime}s | Total: ${totalTime}s | Speed: ${joistsPerSecond} joists/sec`;

    // Update final library info
    updateLibraryInfo(
      stats,
      result.uniqueVariantsUsed,
      result.avgInstantiationTime
    );

    // Setup floor and design controls
    setupFloorControls(result.numberOfFloors);
    setupDesignControls();

    // Setup enhanced performance monitoring for Big Kahuna
    if (scene.userData?.renderer) {
      setupPerformanceMonitor(scene.userData.renderer);
    }

    setTimeout(() => {
      if (loader) loader.classList.add("hidden");
    }, 3000); // Give extra time to admire the Big Kahuna
  } catch (error) {
    console.error("Error in Big Kahuna main:", error);
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    if (progressText)
      progressText.innerText =
        "🌺 Big Kahuna encountered an error. Check console for details.";
    if (timeInfo) timeInfo.innerText = `Failed after ${elapsed}s`;
    setTimeout(() => {
      if (loader) loader.classList.add("hidden");
    }, 3000);
  }
}

main();
