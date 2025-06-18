// WhatIfTheJoistsAreDifferent.js
import { CreateJoist } from '../Joists/Joist.js';

// This function creates a "unique" joist template with slight variations
// In reality, each would have different parameters, but for demo purposes
// we'll create the same joist and apply tiny variations to simulate uniqueness
export async function CreateUniqueJoist(oc, joistIndex, bayIndex, floorIndex) {
  console.log(`Creating unique joist ${joistIndex} for bay ${bayIndex}, floor ${floorIndex}...`);
  
  // Create the base joist (same as template, but treated as unique)
  const baseJoist = await CreateJoist(oc);
  
  // Apply rotation (same as template - 90 degrees around Y-axis)
  const transform = new oc.gp_Trsf_1();
  const yAxis = new oc.gp_Ax1_2(new oc.gp_Pnt_3(0, 0, 0), new oc.gp_Dir_4(0, 1, 0));
  transform.SetRotation_1(yAxis, Math.PI / 2);

  // Add tiny variations to simulate "uniqueness" without changing appearance significantly
  // In reality, these would be meaningful parameter changes (length, depth, etc.)
  const uniqueTransform = new oc.gp_Trsf_1();
  const microRotation = (joistIndex % 10) * 0.0001; // Tiny rotation variation
  const microScale = 1.0 + (joistIndex % 5) * 0.0001; // Tiny scale variation
  
  uniqueTransform.SetRotation_1(yAxis, microRotation);
  transform.PreMultiply(uniqueTransform);
  
  const transformer = new oc.BRepBuilderAPI_Transform_2(baseJoist, transform, false);
  const uniqueJoist = transformer.Shape();

  // Clean up intermediate shapes
  baseJoist.delete();
  transform.delete();
  uniqueTransform.delete();
  yAxis.delete();
  transformer.delete();
  
  return uniqueJoist;
}