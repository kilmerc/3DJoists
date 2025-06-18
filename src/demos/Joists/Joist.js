// Joist.js

// This function will be called by the main application to create the joist
export async function CreateJoist(oc) {
  // =================================================================================
  // 1. DEFINE PARAMETERS
  // =================================================================================

  const topChordLength = 48 * 12;   // 48 feet in inches
  const bottomChordLength = 42 * 12; // 42 feet in inches
  const joistDepth = 36;          // 36 inches

  const numTopNodes = 17;
  const numBottomNodes = 16;

  const angleLeg1 = 3;
  const angleLeg2 = 3;  // Changed from 2 to 3 for 3x3 angles
  const angleThickness = 0.25;
  const angleGap = 1.0;
  const webDiameter = 1.0;

  // =================================================================================
  // 2. CALCULATE NODE COORDINATES
  // =================================================================================

  const topNodes = [];
  const bottomNodes = [];

  const topSpacing = topChordLength / (numTopNodes - 1);
  const bottomSpacing = bottomChordLength / (numBottomNodes - 1);

  const topXStart = -topChordLength / 2;
  for (let i = 0; i < numTopNodes; i++) {
    topNodes.push(new oc.gp_Pnt_3(topXStart + i * topSpacing, joistDepth, 0));
  }

  const bottomXStart = -bottomChordLength / 2;
  for (let i = 0; i < numBottomNodes; i++) {
    bottomNodes.push(new oc.gp_Pnt_3(bottomXStart + i * bottomSpacing, 0, 0));
  }

  // =================================================================================
  // 3. CREATE 2D CROSS-SECTION PROFILES
  // =================================================================================

  const makeFace = (wire) => {
    return new oc.BRepBuilderAPI_MakeFace_15(wire, false).Face();
  };

  const createTopChordProfile = () => {
    const halfGap = angleGap / 2;
    
    // Create a compound to hold both angles
    const compoundBuilder = new oc.BRep_Builder();
    const compound = new oc.TopoDS_Compound();
    compoundBuilder.MakeCompound(compound);
    
    // First L-shaped angle in YZ plane (X=constant for extrusion along X)
    // vertical leg pointing down (negative Y), horizontal leg in Z direction
    const wire1 = new oc.BRepBuilderAPI_MakePolygon_1();
    wire1.Add_1(new oc.gp_Pnt_3(0, 0, halfGap));
    wire1.Add_1(new oc.gp_Pnt_3(0, -angleLeg1, halfGap));
    wire1.Add_1(new oc.gp_Pnt_3(0, -angleLeg1, halfGap + angleThickness));
    wire1.Add_1(new oc.gp_Pnt_3(0, -angleThickness, halfGap + angleThickness));
    wire1.Add_1(new oc.gp_Pnt_3(0, -angleThickness, halfGap + angleLeg2));
    wire1.Add_1(new oc.gp_Pnt_3(0, 0, halfGap + angleLeg2));
    wire1.Close();
    const face1 = makeFace(wire1.Wire());
    compoundBuilder.Add(compound, face1);
    wire1.delete();
    face1.delete();

    // Second L-shaped angle - mirrored position
    const wire2 = new oc.BRepBuilderAPI_MakePolygon_1();
    wire2.Add_1(new oc.gp_Pnt_3(0, 0, -halfGap));
    wire2.Add_1(new oc.gp_Pnt_3(0, -angleLeg1, -halfGap));
    wire2.Add_1(new oc.gp_Pnt_3(0, -angleLeg1, -halfGap - angleThickness));
    wire2.Add_1(new oc.gp_Pnt_3(0, -angleThickness, -halfGap - angleThickness));
    wire2.Add_1(new oc.gp_Pnt_3(0, -angleThickness, -halfGap - angleLeg2));
    wire2.Add_1(new oc.gp_Pnt_3(0, 0, -halfGap - angleLeg2));
    wire2.Close();
    const face2 = makeFace(wire2.Wire());
    compoundBuilder.Add(compound, face2);
    wire2.delete();
    face2.delete();
    
    return compound;
  };

  const createBottomChordProfile = () => {
    const topProfile = createTopChordProfile();
    const axis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(1, 0, 0));
    const transform = new oc.gp_Trsf_1(); 
    transform.SetRotation_1(axis, Math.PI);
    const transformer = new oc.BRepBuilderAPI_Transform_2(topProfile, transform, false);
    const bottomProfile = transformer.Shape();
    
    // Clean up
    axis.delete();
    transform.delete();
    transformer.delete();
    topProfile.delete();
    
    return bottomProfile;
  };

  // =================================================================================
  // 4. GENERATE 3D MEMBERS
  // =================================================================================
  const allJoistParts = [];

  // --- Create Top Chord ---
  const topProfile = createTopChordProfile();
  const topStartNode = topNodes[0];
  const topEndNode = topNodes[topNodes.length - 1];
  
  // Position the profile at the start of the top chord
  const topTransform = new oc.gp_Trsf_1();
  topTransform.SetTranslation_1(new oc.gp_Vec_4(topStartNode.X(), topStartNode.Y(), topStartNode.Z()));
  const topTransformer = new oc.BRepBuilderAPI_Transform_2(topProfile, topTransform, false);
  const positionedTopProfile = topTransformer.Shape();
  
  // Create the sweep vector for the top chord
  const topChordVec = new oc.gp_Vec_4(topEndNode.X() - topStartNode.X(), 0, 0);
  const topChordPrism = new oc.BRepPrimAPI_MakePrism_1(positionedTopProfile, topChordVec, false, true);
  const topChordSolid = topChordPrism.Shape();
  allJoistParts.push(topChordSolid);
  
  // Clean up
  topProfile.delete();
  topTransform.delete();
  topTransformer.delete();
  positionedTopProfile.delete();
  topChordVec.delete();
  topChordPrism.delete();

  // --- Create Bottom Chord ---
  const bottomProfile = createBottomChordProfile();
  const bottomStartNode = bottomNodes[0];
  const bottomEndNode = bottomNodes[bottomNodes.length - 1];
  
  // Position the profile at the start of the bottom chord
  const bottomTransform = new oc.gp_Trsf_1();
  bottomTransform.SetTranslation_1(new oc.gp_Vec_4(bottomStartNode.X(), bottomStartNode.Y(), bottomStartNode.Z()));
  const bottomTransformer = new oc.BRepBuilderAPI_Transform_2(bottomProfile, bottomTransform, false);
  const positionedBottomProfile = bottomTransformer.Shape();
  
  // Create the sweep vector for the bottom chord
  const bottomChordVec = new oc.gp_Vec_4(bottomEndNode.X() - bottomStartNode.X(), 0, 0);
  const bottomChordPrism = new oc.BRepPrimAPI_MakePrism_1(positionedBottomProfile, bottomChordVec, false, true);
  const bottomChordSolid = bottomChordPrism.Shape();
  allJoistParts.push(bottomChordSolid);
  
  // Clean up
  bottomProfile.delete();
  bottomTransform.delete();
  bottomTransformer.delete();
  positionedBottomProfile.delete();
  bottomChordVec.delete();
  bottomChordPrism.delete();

  // --- Create Web Members ---
  const createWebProfile = () => {
    const center = new oc.gp_Pnt_3(0, 0, 0);
    const dir = new oc.gp_Dir_4(0, 0, 1);
    const axis = new oc.gp_Ax2_3(center, dir);
    const circleGeom = new oc.GC_MakeCircle_2(axis, webDiameter / 2).Value();
    const curveHandle = new oc.Handle_Geom_Curve_2(circleGeom.get());
    const edge = new oc.BRepBuilderAPI_MakeEdge_24(curveHandle).Edge();
    const wire = new oc.BRepBuilderAPI_MakeWire_2(edge).Wire();
    const face = makeFace(wire);
    
    // Clean up
    center.delete();
    dir.delete();
    axis.delete();
    curveHandle.delete();
    edge.delete();
    wire.delete();
    
    return face;
  };

  const makeCylinder = (p1, p2) => {
    // Calculate length and direction
    const dx = p2.X() - p1.X();
    const dy = p2.Y() - p1.Y();
    const dz = p2.Z() - p1.Z();
    const length = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Create cylinder along Z-axis at origin
    const origin = new oc.gp_Pnt_3(0, 0, 0);
    const zDir = new oc.gp_Dir_4(0, 0, 1);
    const cylAxis = new oc.gp_Ax2_3(origin, zDir);
    const cylinder = new oc.BRepPrimAPI_MakeCylinder_3(cylAxis, webDiameter/2, length);
    const cylShape = cylinder.Shape();
    
    // Create transformation to position and orient the cylinder
    const transform = new oc.gp_Trsf_1();
    
    // First rotate to align with the member direction
    const memberDir = new oc.gp_Dir_4(dx/length, dy/length, dz/length);
    const angle = zDir.Angle(memberDir);
    
    if (angle > 0.001 && angle < Math.PI - 0.001) {
      const rotAxis = zDir.Crossed(memberDir);
      const rotAxisPnt = new oc.gp_Ax1_2(origin, rotAxis);
      transform.SetRotation_1(rotAxisPnt, angle);
      rotAxisPnt.delete();
      rotAxis.delete();
    }
    
    // Then translate to start position
    const translationTransform = new oc.gp_Trsf_1();
    translationTransform.SetTranslation_1(new oc.gp_Vec_4(p1.X(), p1.Y(), p1.Z()));
    transform.PreMultiply(translationTransform);
    translationTransform.delete();
    
    // Apply transformation
    const transformer = new oc.BRepBuilderAPI_Transform_2(cylShape, transform, false);
    const finalShape = transformer.Shape();
    
    // Clean up
    origin.delete();
    zDir.delete();
    cylAxis.delete();
    cylinder.delete();
    cylShape.delete();
    memberDir.delete();
    transform.delete();
    transformer.delete();
    
    return finalShape;
  };

  // Create web members in a zig-zag pattern
  for (let i = 0; i < numBottomNodes; i++) {
    // Vertical or diagonal member from bottom to top
    if (i < numTopNodes) {
      const webMember = makeCylinder(bottomNodes[i], topNodes[i]);
      allJoistParts.push(webMember);
    }
    
    // Diagonal member from bottom to next top node
    if (i < numTopNodes - 1) {
      const webMember = makeCylinder(bottomNodes[i], topNodes[i + 1]);
      allJoistParts.push(webMember);
    }
  }

  // Clean up node points
  topNodes.forEach(node => node.delete());
  bottomNodes.forEach(node => node.delete());

  // =================================================================================
  // 5. ASSEMBLE THE JOIST
  // =================================================================================

  const joistCompoundBuilder = new oc.BRep_Builder();
  const joistCompound = new oc.TopoDS_Compound();
  joistCompoundBuilder.MakeCompound(joistCompound);

  allJoistParts.forEach(part => {
    joistCompoundBuilder.Add(joistCompound, part);
    part.delete();
  });

  return joistCompound;
}