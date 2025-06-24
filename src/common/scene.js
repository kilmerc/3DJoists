/**
 * Three.js Scene Setup and Management
 * 
 * This module provides functionality for setting up a complete 3D viewport with:
 * - Perspective and orthographic camera modes with seamless switching
 * - Orbit controls for navigation
 * - View cube for quick camera positioning
 * - Lighting setup optimized for CAD geometry
 * - Automatic window resizing handling
 * 
 * The scene is designed specifically for architectural/engineering applications
 * where precise navigation and view control is essential.
 */

import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  Color,
  Geometry,
  Mesh,
  MeshStandardMaterial,
  Vector3,
  Box3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import openCascadeHelper from "./openCascadeHelper.js";

/**
 * Sets up a complete Three.js viewport with enhanced camera controls and view cube
 * 
 * Creates a professional CAD-style viewport with:
 * - Dual camera system (perspective/orthographic)
 * - Interactive view cube for standard views
 * - Professional lighting setup
 * - Responsive design
 * 
 * @returns {Scene} Configured Three.js scene with userData containing controls
 */
export function setupThreeJSViewport() {
  // === SCENE INITIALIZATION ===
  var scene = new Scene();
  scene.background = new Color(0x282c34); // Dark gray background

  // === CAMERA SETUP ===
  // Create both camera types - user can switch between them
  var perspectiveCamera = new PerspectiveCamera(
    75,                               // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                             // Near clipping plane
    20000                            // Far clipping plane
  );
  
  var orthographicCamera = new OrthographicCamera(
    -5000, 5000,  // Left, right bounds
    5000, -5000,  // Top, bottom bounds  
    0.1,          // Near clipping plane
    20000         // Far clipping plane
  );

  // Start with perspective camera
  var currentCamera = perspectiveCamera;
  var isPerspective = true;

  // === RENDERER SETUP ===
  var renderer = new WebGLRenderer({ antialias: true });
  const viewport = document.getElementById("viewport");
  if (!viewport) {
    console.error("The 'viewport' element was not found in the DOM!");
    return;
  }

  /**
   * Updates renderer and camera sizes when window is resized
   * Maintains proper aspect ratios for both camera types
   */
  const updateSize = () => {
    const viewportRect = viewport.getBoundingClientRect();
    renderer.setSize(viewportRect.width, viewportRect.height);

    // Update perspective camera aspect ratio
    perspectiveCamera.aspect = viewportRect.width / viewportRect.height;
    perspectiveCamera.updateProjectionMatrix();

    // Update orthographic camera bounds to maintain aspect ratio
    const aspect = viewportRect.width / viewportRect.height;
    const frustumSize = 10000;
    orthographicCamera.left = (-frustumSize * aspect) / 2;
    orthographicCamera.right = (frustumSize * aspect) / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = -frustumSize / 2;
    orthographicCamera.updateProjectionMatrix();
  };

  // Set up resize handling and initial sizing
  window.addEventListener("resize", updateSize);
  updateSize();
  viewport.appendChild(renderer.domElement);

  // === LIGHTING SETUP ===
  // Professional 3-point lighting setup for CAD visualization
  
  // Ambient light provides base illumination
  const light = new AmbientLight(0x606060); // Soft gray ambient light
  scene.add(light);
  
  // Primary directional light (key light)
  const directionalLight = new DirectionalLight(0xffffff, 0.75);
  directionalLight.position.set(500, 500, 500);
  scene.add(directionalLight);
  
  // Secondary directional light (fill light) from opposite direction
  const directionalLight2 = new DirectionalLight(0xffffff, 0.35);
  directionalLight2.position.set(-500, -500, -500);
  scene.add(directionalLight2);

  // === CAMERA POSITIONING ===
  // Set initial positions for both cameras (isometric-style view)
  perspectiveCamera.position.set(3500, 2000, 3500);
  orthographicCamera.position.set(3500, 2000, 3500);

  // === ORBIT CONTROLS SETUP ===
  // Create separate controls for each camera type
  const perspectiveControls = new OrbitControls(
    perspectiveCamera,
    renderer.domElement
  );
  const orthographicControls = new OrbitControls(
    orthographicCamera,
    renderer.domElement
  );

  // Configure controls for CAD-style navigation
  perspectiveControls.screenSpacePanning = true;  // Pan in screen space
  orthographicControls.screenSpacePanning = true;
  perspectiveControls.target.set(0, 0, 0);        // Look at origin
  orthographicControls.target.set(0, 0, 0);

  var currentControls = perspectiveControls;

  // === CAMERA TOGGLE BUTTON ===
  const cameraToggleButton = document.createElement("button");
  cameraToggleButton.innerHTML = "📹 Perspective";
  cameraToggleButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: rgba(0,0,0,0.8);
    color: white;
    border: 2px solid #00ff00;
    padding: 8px 12px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  // Button hover effects
  cameraToggleButton.addEventListener("mouseenter", () => {
    cameraToggleButton.style.background = "rgba(0,255,0,0.2)";
  });

  cameraToggleButton.addEventListener("mouseleave", () => {
    cameraToggleButton.style.background = "rgba(0,0,0,0.8)";
  });

  // === VIEW CUBE SETUP ===
  // Interactive view cube for quick camera positioning
  const viewCube = document.createElement("div");
  viewCube.style.cssText = `
    position: absolute;
    bottom: 10px;
    right: 10px;
    z-index: 1000;
    background: rgba(0,0,0,0.8);
    border: 2px solid #0066ff;
    border-radius: 8px;
    padding: 10px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: white;
  `;

  // Create view cube HTML structure
  viewCube.innerHTML = `
    <div style="text-align: center; margin-bottom: 8px; font-weight: bold; color: #0066ff;">View Cube</div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; width: 120px;">
      <button class="view-btn" data-view="top-left">↖</button>
      <button class="view-btn" data-view="top">🔝 Top</button>
      <button class="view-btn" data-view="top-right">↗</button>
      <button class="view-btn" data-view="left">⬅ Left</button>
      <button class="view-btn" data-view="iso">🎯 ISO</button>
      <button class="view-btn" data-view="right">➡ Right</button>
      <button class="view-btn" data-view="bottom-left">↙</button>
      <button class="view-btn" data-view="bottom">🔽 Bot</button>
      <button class="view-btn" data-view="bottom-right">↘</button>
    </div>
    <div style="margin-top: 8px; display: flex; gap: 2px;">
      <button class="view-btn" data-view="front" style="flex: 1;">Front</button>
      <button class="view-btn" data-view="back" style="flex: 1;">Back</button>
    </div>
  `;

  // === VIEW CUBE BUTTON STYLING ===
  const style = document.createElement("style");
  style.textContent = `
    .view-btn {
      background: rgba(0,102,255,0.3);
      color: white;
      border: 1px solid #0066ff;
      padding: 4px 2px;
      font-size: 10px;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s ease;
      min-height: 24px;
    }
    .view-btn:hover {
      background: rgba(0,102,255,0.6);
      transform: scale(1.05);
    }
    .view-btn:active {
      transform: scale(0.95);
    }
  `;
  document.head.appendChild(style);

  // Add UI elements to viewport
  viewport.appendChild(cameraToggleButton);
  viewport.appendChild(viewCube);

  /**
   * Toggles between perspective and orthographic camera modes
   * Preserves camera position and target when switching
   */
  function toggleCamera() {
    // Save current position and target
    const currentPos = currentCamera.position.clone();
    const currentTarget = currentControls.target.clone();

    if (isPerspective) {
      // Switch to orthographic
      currentCamera = orthographicCamera;
      currentControls = orthographicControls;
      cameraToggleButton.innerHTML = "📐 Orthographic";
      cameraToggleButton.style.borderColor = "#ff6600";
      isPerspective = false;
    } else {
      // Switch to perspective
      currentCamera = perspectiveCamera;
      currentControls = perspectiveControls;
      cameraToggleButton.innerHTML = "📹 Perspective";
      cameraToggleButton.style.borderColor = "#00ff00";
      isPerspective = true;
    }

    // Apply saved position and target to new camera
    currentCamera.position.copy(currentPos);
    currentControls.target.copy(currentTarget);
    currentControls.update();
  }

  /**
   * Sets the camera to a predefined view with smooth animation
   * 
   * @param {string} viewType - Type of view (top, front, iso, etc.)
   */
  function setView(viewType) {
    const distance = 5000;
    let position,
      target = new Vector3(0, 0, 0);

    // Define camera positions for standard views
    switch (viewType) {
      case "top":
        position = new Vector3(0, distance, 0);
        break;
      case "bottom":
        position = new Vector3(0, -distance, 0);
        break;
      case "front":
        position = new Vector3(0, 0, distance);
        break;
      case "back":
        position = new Vector3(0, 0, -distance);
        break;
      case "left":
        position = new Vector3(-distance, 0, 0);
        break;
      case "right":
        position = new Vector3(distance, 0, 0);
        break;
      case "iso":
        position = new Vector3(3500, 2000, 3500);
        break;
      case "top-left":
        position = new Vector3(-distance * 0.7, distance * 0.7, distance * 0.7);
        break;
      case "top-right":
        position = new Vector3(distance * 0.7, distance * 0.7, distance * 0.7);
        break;
      case "bottom-left":
        position = new Vector3(
          -distance * 0.7,
          -distance * 0.7,
          distance * 0.7
        );
        break;
      case "bottom-right":
        position = new Vector3(distance * 0.7, -distance * 0.7, distance * 0.7);
        break;
      default:
        position = new Vector3(3500, 2000, 3500);
    }

    // Smooth animation to new view
    const startPos = currentCamera.position.clone();
    const startTarget = currentControls.target.clone();

    let progress = 0;
    const animationDuration = 500; // ms
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      progress = Math.min(elapsed / animationDuration, 1);

      // Smooth easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate camera position and target
      currentCamera.position.lerpVectors(startPos, position, eased);
      currentControls.target.lerpVectors(startTarget, target, eased);
      currentControls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  // === EVENT LISTENERS ===
  cameraToggleButton.addEventListener("click", toggleCamera);

  viewCube.addEventListener("click", (event) => {
    if (event.target.classList.contains("view-btn")) {
      const viewType = event.target.getAttribute("data-view");
      setView(viewType);
    }
  });

  // === ANIMATION LOOP ===
  function animate() {
    requestAnimationFrame(animate);
    currentControls.update();
    renderer.render(scene, currentCamera);
  }
  animate();

  // === STORE REFERENCES ===
  // Store references in scene.userData for external access
  scene.userData = {
    renderer: renderer,
    perspectiveCamera: perspectiveCamera,
    orthographicCamera: orthographicCamera,
    getCurrentCamera: () => currentCamera,
    isPerspective: () => isPerspective,
    toggleCamera: toggleCamera,
    setView: setView,
  };

  return scene;
}

/**
 * Tessellates an OpenCascade shape and adds it to the scene as a mesh
 * 
 * This is a legacy function that uses the older openCascadeHelper approach.
 * For new code, consider using the more efficient tessellation methods
 * found in the demo-specific files.
 * 
 * @param {Object} openCascade - OpenCascade.js instance
 * @param {Object} shape - OpenCascade shape to add
 * @param {Scene} scene - Three.js scene to add the mesh to
 */
export async function addShapeToScene(openCascade, shape, scene) {
  // Initialize the helper with the OpenCascade instance
  openCascadeHelper.setOpenCascade(openCascade);

  // === TESSELLATION PROCESS ===
  // Convert OpenCascade shape to mesh data
  const facelist = await openCascadeHelper.tessellate(shape);
  
  // Combine all face data into unified arrays
  const [locVertexcoord, locNormalcoord, locTriIndices] =
    await openCascadeHelper.joinPrimitives(facelist);
  
  // Calculate total triangle count
  const tot_triangle_count = facelist.reduce(
    (a, b) => a + b.number_of_triangles,
    0
  );
  
  // Generate Three.js compatible geometry data
  const [vertices, faces] = await openCascadeHelper.generateGeometry(
    tot_triangle_count,
    locVertexcoord,
    locNormalcoord,
    locTriIndices
  );

  // === MESH CREATION ===
  // Create material with standard properties for CAD visualization
  const objectMat = new MeshStandardMaterial({
    color: new Color(0.8, 0.8, 0.8), // Light gray
    metalness: 0.2,                   // Slight metallic look
    roughness: 0.6,                   // Not too shiny
  });
  
  // Create Three.js geometry and assign mesh data
  const geometry = new Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  
  // Create the final mesh
  const object = new Mesh(geometry, objectMat);
  object.name = "shape"; // Name for easy identification

  // === SCENE MANAGEMENT ===
  // Remove any existing shape before adding the new one
  // This prevents accumulation of multiple shapes
  const existingShape = scene.getObjectByName("shape");
  if (existingShape) {
    scene.remove(existingShape);
  }

  // Add the new shape to the scene
  scene.add(object);
}