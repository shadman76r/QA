// scripts/extractFigmaSpecs.mjs

// 1) Import Node core modules for file + path handling
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 2) Re-create __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3) Call Figma REST API to get the whole file JSON (all nodes/tree)
async function fetchFigmaFile(fileKey, token) {
  const res = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: { 'X-Figma-Token': token }          // auth header
  });
  const data = await res.json();                 // parse JSON response
  return data;                                   // contains .document (root node)
}

// 4) Recursively walk the node tree and collect only what we care about
function collectSpecs(node, specs = []) {
  // We only keep TEXT and FRAME nodes for now
  if (node.type === 'TEXT' || node.type === 'FRAME') {
    specs.push({
      id: node.id,                               // Figma node id (e.g. "4:1100")
      name: node.name,                           // layer name in Figma
      type: node.type,                           // "TEXT" or "FRAME"
      x: node.absoluteBoundingBox?.x,            // position on canvas (left)
      y: node.absoluteBoundingBox?.y,            // position on canvas (top)
      width: node.absoluteBoundingBox?.width,    // width in px
      height: node.absoluteBoundingBox?.height,  // height in px
      characters: node.characters,               // text content (for TEXT nodes)
      fontSize: node.style?.fontSize,            // font size (for TEXT nodes)
      fontFamily: node.style?.fontFamily,        // font family (for TEXT nodes)
      fills: node.fills,                         // color/fill info
    });
  }

  // If this node has children, recurse through them
  if (node.children) {
    for (const child of node.children) {
      collectSpecs(child, specs);
    }
  }

  return specs;                                  // array of all collected specs
}

// 5) Entry point: read args, call API, save specs to file
async function main() {
  const fileKey = process.argv[2];               // from command line
  const token = process.argv[3];

  const fileData = await fetchFigmaFile(fileKey, token);
  const document = fileData.document;            // root DOCUMENT node

  const specs = collectSpecs(document);          // collect all FRAME/TEXT specs

  const outPath = path.join(__dirname, '..', 'artifacts', 'figma-specs.json');
  fs.writeFileSync(outPath, JSON.stringify(specs, null, 2), 'utf8');
  console.log('Saved Figma specs to', outPath);
}

main().catch(console.error);
