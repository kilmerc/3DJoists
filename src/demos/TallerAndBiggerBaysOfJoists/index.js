import initOpenCascade from "opencascade.js";
import * as THREE from "three";
import { CreateJoistTemplate } from "./TallerAndBiggerBaysOfJoists.js";
import { setupThreeJSViewport } from "../../common/scene.js";

function tessellateShape(oc, shape) {
  // Apply mesh generation with appropriate parameters
  new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.5, false);

  const allVertices = [];
  const allTriangles = [];
  let vertexOffset = 0;

  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );
  
  while (explorer.More()) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const location = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, location, 0);

    if (!triangulation.IsNull()) {
      const tri = triangulation.get();
      const trans = location.Transformation();
      
      // Get node count and triangle count
      const nodeCount = tri.NbNodes();
      const triangleCount = tri.NbTriangles();
      
      if (nodeCount > 0 && triangleCount > 0) {
        // Extract vertices
        for (let i = 1; i <= nodeCount; i++) {
          const node = tri.Node(i);
          node.Transform(trans);
          allVertices.push(node.X(), node.Y(), node.Z());
        }

        // Extract triangles
        for (let i = 1; i <= triangleCount; i++) {
          const triangle = tri.Triangle(i);
          const n1 = triangle.Value(1);
          const n2 = triangle.Value(2);
          const n3 = triangle.Value(3);
          
          allTriangles.push(
            n1 - 1 + vertexOffset,
            n2 - 1 + vertexOffset,
            n3 - 1 + vertexOffset
          );
        }

        vertexOffset += nodeCount;
      }
      
      triangulation.delete();
    }

    location.delete();
    face.delete();
    explorer.Next();
  }
  explorer.delete();

  // Check if we got any geometry
  if (allVertices.length === 0) {
    console.error("No vertices extracted from shape tessellation");
    // Create a simple fallback geometry
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000, // Red to indicate error
      side: THREE.DoubleSide,
    });
    return { mesh: new THREE.Mesh(geometry, material), material: material };
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(allVertices, 3)
  );
  
  if (allTriangles.length > 0) {
    geometry.setIndex(allTriangles);
  }

  geometry.computeVertexNormals();

  const material = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
  });
  const finalMesh = new THREE.Mesh(geometry, material);

  return { mesh: finalMesh, material: material };
}

// This is the main function for our demo
async function main() {
  const loader = document.getElementById("loader");
  const progressText = document.getElementById("progress-text");
  loader.classList.remove("hidden");

  const scene = setupThreeJSViewport();
  if (!scene) {
    loader.classList.add("hidden");
    return;
  }

  try {
    progressText.innerText = "Initializing OpenCascade...";
    const oc = await initOpenCascade();

    progressText.innerText = "Creating joist template...";
    const templateShape = await CreateJoistTemplate(oc);

    progressText.innerText = "Tessellating template shape...";
    const { mesh, material } = tessellateShape(oc, templateShape);
    const geometry = mesh.geometry;
    
    // Clean up the template shape
    templateShape.delete();

    progressText.innerText = "Setting up instanced rendering...";

    const joistsPerBay = 100;
    const numberOfBays = 10;
    const numberOfFloors = 5;
    const joistSpacing = 8 * 12;    // 8 feet in inches
    const bayWidth = 48 * 12;       // 48 feet in inches
    const storyHeight = 32 * 12;    // 32 feet in inches
    const totalJoists = numberOfFloors * numberOfBays * joistsPerBay;

    const totalLength = (joistsPerBay - 1) * joistSpacing;
    const totalWidth = numberOfBays * bayWidth;
    const totalHeight = (numberOfFloors - 1) * storyHeight;

    console.log(`Creating ${numberOfFloors} floors with ${numberOfBays} bays and ${joistsPerBay} joists each...`);
    console.log(`Total dimensions: ${totalLength/12}' x ${totalWidth/12}' x ${totalHeight/12}'`);
    console.log(`Total joists to create: ${totalJoists}`);

    const instancedMesh = new THREE.InstancedMesh(
      geometry,
      material,
      totalJoists
    );
    scene.add(instancedMesh);

    let joistCount = 0;
    const matrix = new THREE.Matrix4();

    progressText.innerText = "Positioning joists...";

    // Create each floor
    for (let floorIndex = 0; floorIndex < numberOfFloors; floorIndex++) {
      const yPosition = floorIndex * storyHeight;
      
      // Create each bay on this floor
      for (let bayIndex = 0; bayIndex < numberOfBays; bayIndex++) {
        // Create joists for this bay
        for (let joistIndex = 0; joistIndex < joistsPerBay; joistIndex++) {
          const xPosition = joistIndex * joistSpacing - totalLength / 2;
          const zPosition = bayIndex * bayWidth - totalWidth / 2 + bayWidth / 2;

          matrix.setPosition(xPosition, yPosition, zPosition);
          instancedMesh.setMatrixAt(joistCount, matrix);

          joistCount++;
        }
      }

      // Update progress per floor to avoid blocking
      const percentage = Math.round((joistCount / totalJoists) * 100);
      progressText.innerText = `Positioning floor ${floorIndex + 1} of ${numberOfFloors} - ${joistCount} of ${totalJoists} joists (${percentage}%)`;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    instancedMesh.instanceMatrix.needsUpdate = true;

    console.log(`Instanced mesh created with ${totalJoists} joists across ${numberOfFloors} floors!`);
    progressText.innerText = "Complete!";
    
    // Small delay before hiding loader to show completion message
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 500);

  } catch (error) {
    console.error("Error in main:", error);
    progressText.innerText = "Error occurred. Check console for details.";
    setTimeout(() => {
      loader.classList.add("hidden");
    }, 2000);
  }
}

main();