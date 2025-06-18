import initOpenCascade from "opencascade.js";
import { CreateBaysOfJoists } from './BaysOfJoists.js';
import { setupThreeJSViewport, addShapeToScene } from '../../common/scene.js';

// This is the main function for our demo
async function main() {
  // Get loader elements from the DOM
  const loader = document.getElementById('loader');
  const progressText = document.getElementById('progress-text');

  // Show the loader
  loader.classList.remove('hidden');

  // First, set up the 3D scene
  const scene = setupThreeJSViewport();
  if (!scene) { 
    loader.classList.add('hidden');
    return; 
  }

  // Define the callback function to update the loader UI
  const progressCallback = (message, current, total) => {
    console.log(message);
    const percentage = Math.round((current / total) * 100);
    if (!isNaN(percentage)) {
        progressText.innerText = `${message} (${percentage}%)`;
    } else {
        progressText.innerText = message;
    }
  };

  // Initialize OpenCascade
  progressText.innerText = "Hey, I am not a developer, and 250 is a lot of joists, this takes a minute, please wait...";
  const oc = await initOpenCascade();

  // Create the Bays of Joists
  console.log("Creating Bays of Joists...");
  const startTime = Date.now();
  
  // Pass the callback function to the creator
  const baysShape = await CreateBaysOfJoists(oc, progressCallback);
  
  const endTime = Date.now();
  console.log(`Bays of Joists created in ${(endTime - startTime) / 1000} seconds.`);
  
  // Add the final shape to the scene
  progressText.innerText = "Adding shape to the scene...";
  await addShapeToScene(oc, baysShape, scene);
  console.log("Bays of Joists added to scene!");

  // Hide the loader
  loader.classList.add('hidden');
}

main();