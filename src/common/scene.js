import {
  AmbientLight,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Color,
  Geometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import openCascadeHelper from './openCascadeHelper.js'; // Note the corrected path

/**
 * Sets up a basic Three.js scene, camera, renderer, and controls.
 * @returns {THREE.Scene} The configured Three.js scene.
 */
export function setupThreeJSViewport() {
  var scene = new Scene();
  scene.background = new Color(0x282c34); // A nice dark background

  // MODIFIED: Increased the 'far' clipping plane to 20000 to see the whole model
  var camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);

  var renderer = new WebGLRenderer({ antialias: true });
  const viewport = document.getElementById("viewport");
  if (!viewport) {
    console.error("The 'viewport' element was not found in the DOM!");
    return;
  }

  // Handle window resizing
  const updateSize = () => {
    const viewportRect = viewport.getBoundingClientRect();
    renderer.setSize(viewportRect.width, viewportRect.height);
    camera.aspect = viewportRect.width / viewportRect.height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', updateSize);
  updateSize(); // Set initial size

  viewport.appendChild(renderer.domElement);

  const light = new AmbientLight(0x606060); // Softer ambient light
  scene.add(light);
  const directionalLight = new DirectionalLight(0xffffff, 0.75);
  directionalLight.position.set(500, 500, 500);
  scene.add(directionalLight);
  const directionalLight2 = new DirectionalLight(0xffffff, 0.35);
  directionalLight2.position.set(-500, -500, -500);
  scene.add(directionalLight2);

  // MODIFIED: Set a new "broadside" camera position, looking from a distance.
  camera.position.set(3500, 2000, 3500);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.screenSpacePanning = true;
  // ADDED: Ensure the camera starts by looking at the center of the model.
  controls.target.set(0, 0, 0);
  
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  return scene;
}

/**
 * Tessellates an OpenCascade shape and adds it to the scene.
 * This is based on the function in the bottle-basic demo.
 */
export async function addShapeToScene(openCascade, shape, scene) {
  openCascadeHelper.setOpenCascade(openCascade);

  // Tessellate the shape
  const facelist = await openCascadeHelper.tessellate(shape);
  const [locVertexcoord, locNormalcoord, locTriIndices] = await openCascadeHelper.joinPrimitives(facelist);
  const tot_triangle_count = facelist.reduce((a, b) => a + b.number_of_triangles, 0);
  const [vertices, faces] = await openCascadeHelper.generateGeometry(tot_triangle_count, locVertexcoord, locNormalcoord, locTriIndices);

  // Create the Three.js mesh
  const objectMat = new MeshStandardMaterial({
    color: new Color(0.8, 0.8, 0.8),
    metalness: 0.2,
    roughness: 0.6
  });
  const geometry = new Geometry();
  geometry.vertices = vertices;
  geometry.faces = faces;
  const object = new Mesh(geometry, objectMat);
  object.name = "shape";
  
  // REMOVED: This line was rotating the horizontal roof to be vertical.
  // object.rotation.x = -Math.PI / 2;
  
  // Remove any existing shape before adding the new one
  const existingShape = scene.getObjectByName("shape");
  if (existingShape) {
    scene.remove(existingShape);
  }
  
  scene.add(object);
}