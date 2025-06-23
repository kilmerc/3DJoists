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
 * Enhanced Three.js scene setup with camera controls and view cube
 */
export function setupThreeJSViewport() {
  var scene = new Scene();
  scene.background = new Color(0x282c34);

  // Create both perspective and orthographic cameras
  var perspectiveCamera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    20000
  );
  var orthographicCamera = new OrthographicCamera(
    -5000,
    5000,
    5000,
    -5000,
    0.1,
    20000
  );

  // Start with perspective camera
  var currentCamera = perspectiveCamera;
  var isPerspective = true;

  var renderer = new WebGLRenderer({ antialias: true });
  const viewport = document.getElementById("viewport");
  if (!viewport) {
    console.error("The 'viewport' element was not found in the DOM!");
    return;
  }

  // Handle window resizing for both cameras
  const updateSize = () => {
    const viewportRect = viewport.getBoundingClientRect();
    renderer.setSize(viewportRect.width, viewportRect.height);

    // Update perspective camera
    perspectiveCamera.aspect = viewportRect.width / viewportRect.height;
    perspectiveCamera.updateProjectionMatrix();

    // Update orthographic camera
    const aspect = viewportRect.width / viewportRect.height;
    const frustumSize = 10000;
    orthographicCamera.left = (-frustumSize * aspect) / 2;
    orthographicCamera.right = (frustumSize * aspect) / 2;
    orthographicCamera.top = frustumSize / 2;
    orthographicCamera.bottom = -frustumSize / 2;
    orthographicCamera.updateProjectionMatrix();
  };

  window.addEventListener("resize", updateSize);
  updateSize();

  viewport.appendChild(renderer.domElement);

  // Lighting setup
  const light = new AmbientLight(0x606060);
  scene.add(light);
  const directionalLight = new DirectionalLight(0xffffff, 0.75);
  directionalLight.position.set(500, 500, 500);
  scene.add(directionalLight);
  const directionalLight2 = new DirectionalLight(0xffffff, 0.35);
  directionalLight2.position.set(-500, -500, -500);
  scene.add(directionalLight2);

  // Set initial camera positions
  perspectiveCamera.position.set(3500, 2000, 3500);
  orthographicCamera.position.set(3500, 2000, 3500);

  // Setup controls for both cameras
  const perspectiveControls = new OrbitControls(
    perspectiveCamera,
    renderer.domElement
  );
  const orthographicControls = new OrbitControls(
    orthographicCamera,
    renderer.domElement
  );

  perspectiveControls.screenSpacePanning = true;
  orthographicControls.screenSpacePanning = true;
  perspectiveControls.target.set(0, 0, 0);
  orthographicControls.target.set(0, 0, 0);

  var currentControls = perspectiveControls;

  // Create camera toggle button
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

  cameraToggleButton.addEventListener("mouseenter", () => {
    cameraToggleButton.style.background = "rgba(0,255,0,0.2)";
  });

  cameraToggleButton.addEventListener("mouseleave", () => {
    cameraToggleButton.style.background = "rgba(0,0,0,0.8)";
  });

  // Create view cube with adjusted positioning to avoid overlap
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

  // Style view cube buttons
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

  // Add elements to viewport
  viewport.appendChild(cameraToggleButton);
  viewport.appendChild(viewCube);

  // Camera toggle functionality
  function toggleCamera() {
    // Save current position and target
    const currentPos = currentCamera.position.clone();
    const currentTarget = currentControls.target.clone();

    if (isPerspective) {
      // Switch to orthographic
      currentCamera = orthographicCamera;
      currentControls = orthographicControls;
      cameraToggleButton.innerHTML = "📐 Orthographic"; // NOW SHOWS CURRENT
      cameraToggleButton.style.borderColor = "#ff6600";
      isPerspective = false;
    } else {
      // Switch to perspective
      currentCamera = perspectiveCamera;
      currentControls = perspectiveControls;
      cameraToggleButton.innerHTML = "📹 Perspective"; // NOW SHOWS CURRENT
      cameraToggleButton.style.borderColor = "#00ff00";
      isPerspective = true;
    }

    // Apply saved position and target to new camera
    currentCamera.position.copy(currentPos);
    currentControls.target.copy(currentTarget);
    currentControls.update();
  }

  // View cube functionality
  function setView(viewType) {
    const distance = 5000;
    let position,
      target = new Vector3(0, 0, 0);

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

    // Animate camera to new position
    const startPos = currentCamera.position.clone();
    const startTarget = currentControls.target.clone();

    let progress = 0;
    const animationDuration = 500; // ms
    const startTime = performance.now();

    function animate() {
      const elapsed = performance.now() - startTime;
      progress = Math.min(elapsed / animationDuration, 1);

      // Smooth easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      currentCamera.position.lerpVectors(startPos, position, eased);
      currentControls.target.lerpVectors(startTarget, target, eased);
      currentControls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  // Add event listeners
  cameraToggleButton.addEventListener("click", toggleCamera);

  viewCube.addEventListener("click", (event) => {
    if (event.target.classList.contains("view-btn")) {
      const viewType = event.target.getAttribute("data-view");
      setView(viewType);
    }
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    currentControls.update();
    renderer.render(scene, currentCamera);
  }
  animate();

  // Store references for external access
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
 * Tessellates an OpenCascade shape and adds it to the scene.
 */
export async function addShapeToScene(openCascade, shape, scene) {
  openCascadeHelper.setOpenCascade(openCascade);

  const facelist = await openCascadeHelper.tessellate(shape);
  const [locVertexcoord, locNormalcoord, locTriIndices] =
    await openCascadeHelper.joinPrimitives(facelist);
  const tot_triangle_count = facelist.reduce(
    (a, b) => a + b.number_of_triangles,
    0
  );
  const [vertices, faces] = await openCascadeHelper.generateGeometry(
    tot_triangle_count,
    locVertexcoord,
    locNormalcoord,
    locTriIndices
  );

  const objectMat = new MeshStandardMaterial({
    color: new Color(0.8, 0.8, 0.8),
    metalness: 0.2,
    roughness: 0.6,
  });
  const geometry = new Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  const object = new Mesh(geometry, objectMat);
  object.name = "shape";

  // Remove any existing shape before adding the new one
  const existingShape = scene.getObjectByName("shape");
  if (existingShape) {
    scene.remove(existingShape);
  }

  scene.add(object);
}