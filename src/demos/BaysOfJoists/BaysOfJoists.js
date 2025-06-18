// BaysOfJoists.js
import { CreateJoist } from '../Joists/Joist.js';

// This function creates a building roof structure with multiple bays of joists
export async function CreateBaysOfJoists(oc) {
  // =================================================================================
  // 1. DEFINE PARAMETERS
  // =================================================================================
  
  const joistsPerBay = 50;        // Reduced from 50 for performance testing
  const numberOfBays = 5;         // Reduced from 5 for performance testing
  const joistSpacing = 8 * 12;    // 8 feet in inches
  const bayWidth = 48 * 12;       // 48 feet in inches (width of each joist)
  
  // Calculate total dimensions
  const totalLength = (joistsPerBay - 1) * joistSpacing;  // Length of one bay
  const totalWidth = numberOfBays * bayWidth;              // Total width across all bays
  
  console.log(`Creating ${numberOfBays} bays with ${joistsPerBay} joists each...`);
  console.log(`Total dimensions: ${totalLength/12}' x ${totalWidth/12}'`);
  console.log(`Total joists to create: ${numberOfBays * joistsPerBay}`);
  
  // =================================================================================
  // 2. CREATE A SINGLE JOIST TEMPLATE
  // =================================================================================
  
  console.log("Creating joist template...");
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
      // =================================================================
      // START OF FIX
      // =================================================================

      // 1. Create an empty copier object
      const copier = new oc.BRepBuilderAPI_Copy_1();
      
      // 2. Perform the copy operation
      copier.Perform(templateJoist, false, false);
      
      // 3. Get the copied shape
      const joistCopy = copier.Shape();

      // =================================================================
      // END OF FIX
      // =================================================================
      
      // Calculate position for this joist
      const xPosition = joistIndex * joistSpacing - totalLength / 2;  // Center the bay
      const zPosition = bayIndex * bayWidth - totalWidth / 2 + bayWidth / 2;  // Center all bays
      
      // Create transformation to position the joist
      const transform = new oc.gp_Trsf_1();
      
      // First rotate 90 degrees around Y-axis to orient joists perpendicular to bays
      const yAxis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 1, 0));
      transform.SetRotation_1(yAxis, Math.PI / 2);
      
      // Then translate to final position
      const translationTransform = new oc.gp_Trsf_1();
      translationTransform.SetTranslation_1(new oc.gp_Vec_4(xPosition, 0, zPosition));
      transform.PreMultiply(translationTransform);
      
      // Apply transformation
      const transformer = new oc.BRepBuilderAPI_Transform_2(joistCopy, transform, false);
      const transformedJoist = transformer.Shape();
      
      allBayParts.push(transformedJoist);
      
      // Clean up
      copier.delete();
      joistCopy.delete();
      yAxis.delete();
      transform.delete();
      translationTransform.delete();
      transformer.delete();
      
      joistCount++;
      
      // Progress indicator
      if (joistCount % 5 === 0) {
        console.log(`  Created ${joistCount} joists...`);
      }
    }
  }
  
  // Clean up template
  templateJoist.delete();
  
  // =================================================================================
  // 4. ASSEMBLE THE COMPLETE STRUCTURE
  // =================================================================================
  
  console.log("Assembling complete structure...");
  
  const structureCompoundBuilder = new oc.BRep_Builder();
  const structureCompound = new oc.TopoDS_Compound();
  structureCompoundBuilder.MakeCompound(structureCompound);
  
  allBayParts.forEach((part, index) => {
    structureCompoundBuilder.Add(structureCompound, part);
    part.delete();
  });
  
  console.log(`Complete! Created ${joistCount} total joists.`);
  
  return structureCompound;
}