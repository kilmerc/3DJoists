import initOpenCascade from "opencascade.js";
import { CreateBaysOfJoists } from './BaysOfJoists.js';
import { setupThreeJSViewport, addShapeToScene } from '../../common/scene.js';

// This is the main function for our demo
async function main() {
  // First, set up the 3D scene
  const scene = setupThreeJSViewport();
  if (!scene) { return; }

  // Initialize OpenCascade
  const oc = await initOpenCascade();

  // Create the Bays of Joists
  console.log("Creating Bays of Joists...");
  const startTime = Date.now();
  
  const baysShape = await CreateBaysOfJoists(oc);
  
  const endTime = Date.now();
  console.log(`Bays of Joists created in ${(endTime - startTime) / 1000} seconds.`);
  
  // Add the final shape to the scene
  await addShapeToScene(oc, baysShape, scene);
  console.log("Bays of Joists added to scene!");
}

main();