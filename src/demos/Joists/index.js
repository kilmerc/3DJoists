import initOpenCascade from "opencascade.js";
import { CreateJoist } from './Joist.js';
import { setupThreeJSViewport, addShapeToScene } from '../../common/scene.js';

// This is the main function for our demo
async function main() {
  // First, set up the 3D scene
  const scene = setupThreeJSViewport();
  if (!scene) { return; }

  // Initialize OpenCascade
  const oc = await initOpenCascade();

  // Create the Joist shape
  console.log("Creating Joist...");
  const joistShape = await CreateJoist(oc);
  console.log("Joist created.");
  
  // Add the final shape to the scene
  await addShapeToScene(oc, joistShape, scene);
  console.log("Joist added to scene!");
}

main();