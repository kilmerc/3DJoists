// BaysOfJoists.js
import { CreateJoist } from '../Joists/Joist.js';

// This function creates a building roof structure with multiple bays of joists
// I've added a progressCallback parameter to report the status
export async function CreateBaysOfJoists(oc, progressCallback) {
  // =================================================================================
  // 1. DEFINE PARAMETERS
  // =================================================================================
  
  const joistsPerBay = 50;
  const numberOfBays = 5;
  const joistSpacing = 8 * 12;    // 8 feet in inches
  const bayWidth = 48 * 12;       // 48 feet in inches (width of each joist)
  const totalJoists = numberOfBays * joistsPerBay;
  
  // Calculate total dimensions
  const totalLength = (joistsPerBay - 1) * joistSpacing;  // Length of one bay
  const totalWidth = numberOfBays * bayWidth;              // Total width across all bays
  
  console.log(`Creating ${numberOfBays} bays with ${joistsPerBay} joists each...`);
  console.log(`Total dimensions: ${totalLength/12}' x ${totalWidth/12}'`);
  console.log(`Total joists to create: ${totalJoists}`);
  
  // =================================================================================
  // 2. CREATE A SINGLE JOIST TEMPLATE
  // =================================================================================
  
  console.log("Creating joist template...");
  if (progressCallback) progressCallback("Creating joist template...", 0, totalJoists);
  const templateJoist = await CreateJoist(oc);
  
  // =================================================================================
  // 3. CREATE ALL JOISTS BY COPYING AND TRANSFORMING
  // =================================================================================
  
  const allBayParts = [];
  let joistCount = 0;
  
  // Create each bay
  for (let bayIndex = 0; bayIndex < numberOfBays; bayIndex++) {
    console.log(`Creating bay ${bayIndex + 1} of ${numberOfBays}...`);
    
    // Create joists for this bay
    for (let joistIndex = 0; joistIndex < joistsPerBay; joistIndex++) {
      const copier = new oc.BRepBuilderAPI_Copy_1();
      copier.Perform(templateJoist, false, false);
      const joistCopy = copier.Shape();
      
      const xPosition = joistIndex * joistSpacing - totalLength / 2;
      const zPosition = bayIndex * bayWidth - totalWidth / 2 + bayWidth / 2;
      
      const transform = new oc.gp_Trsf_1();
      const yAxis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 1, 0));
      transform.SetRotation_1(yAxis, Math.PI / 2);
      
      const translationTransform = new oc.gp_Trsf_1();
      translationTransform.SetTranslation_1(new oc.gp_Vec_4(xPosition, 0, zPosition));
      transform.PreMultiply(translationTransform);
      
      const transformer = new oc.BRepBuilderAPI_Transform_2(joistCopy, transform, false);
      const transformedJoist = transformer.Shape();
      
      allBayParts.push(transformedJoist);
      
      joistCount++;
      
      // I've added the callback here to update the UI
      if (progressCallback) {
        const message = `Generating joist ${joistCount} of ${totalJoists}`;
        progressCallback(message, joistCount, totalJoists);
      }
      
      // Clean up
      copier.delete();
      joistCopy.delete();
      yAxis.delete();
      transform.delete();
      translationTransform.delete();
      transformer.delete();
    }
  }
  
  templateJoist.delete();
  
  // =================================================================================
  // 4. ASSEMBLE THE COMPLETE STRUCTURE
  // =================================================================================
  
  console.log("Assembling complete structure...");
  if (progressCallback) progressCallback("Assembling final structure...", totalJoists, totalJoists);
  
  const structureCompoundBuilder = new oc.BRep_Builder();
  const structureCompound = new oc.TopoDS_Compound();
  structureCompoundBuilder.MakeCompound(structureCompound);
  
  allBayParts.forEach((part) => {
    structureCompoundBuilder.Add(structureCompound, part);
    part.delete();
  });
  
  console.log(`Complete! Created ${joistCount} total joists.`);
  
  return structureCompound;
}