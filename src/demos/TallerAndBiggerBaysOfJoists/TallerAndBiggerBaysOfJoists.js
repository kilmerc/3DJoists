// TallerAndBiggerBaysOfJoists.js
import { CreateJoist } from '../Joists/Joist.js';

// This function ONLY creates a single joist template for instancing.
// Same as BiggerBaysOfJoists but with a more descriptive name for the taller demo
export async function CreateJoistTemplate(oc) {
  console.log("Creating joist template for multi-story instancing...");
  const templateJoist = await CreateJoist(oc);
  
  // The joist is created along the X-axis by default.
  // For our scene, it's easier if it's aligned to the Z-axis first.
  // So, we'll apply a 90-degree rotation here.
  const transform = new oc.gp_Trsf_1();
  const yAxis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 1, 0));
  transform.SetRotation_1(yAxis, Math.PI / 2);

  const transformer = new oc.BRepBuilderAPI_Transform_2(templateJoist, transform, false);
  const rotatedJoist = transformer.Shape();

  // Clean up intermediate shapes
  templateJoist.delete();
  transform.delete();
  yAxis.delete();
  transformer.delete();
  
  console.log("Multi-story joist template created.");
  return rotatedJoist;
}