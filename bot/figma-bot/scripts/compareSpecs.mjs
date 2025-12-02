import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(relPath) {
  const full = path.join(__dirname, '..', 'artifacts', relPath);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

// simple text match (case + trim)
function findDomMatch(figmaText, domItems) {
  const target = (figmaText || '').trim();
  if (!target) return null;

  return domItems.find(d => d.text.trim() === target) || null;
}

function main() {
  const figmaSpecs = loadJson('figma-specs.json');
  const domSpecs   = loadJson('dom-specs.json');

  const report = [];

  // Only TEXT nodes from Figma
  const figmaTexts = figmaSpecs.filter(n => n.type === 'TEXT' && n.characters);

  for (const node of figmaTexts) {
    const match = findDomMatch(node.characters, domSpecs);
    if (!match) {
      report.push({
        figmaId: node.id,
        figmaName: node.name,
        text: node.characters,
        status: 'MISSING_IN_DOM',
        message: `Text "${node.characters}" from Figma not found on page`
      });
      continue;
    }

    const issues = [];

    if (node.width && match.width && Math.round(node.width) !== Math.round(match.width)) {
      issues.push({
        prop: 'width',
        expected: node.width,
        actual: match.width,
        message: `Width mismatch: expected ${node.width}px, got ${match.width}px`
      });
    }

    if (node.height && match.height && Math.round(node.height) !== Math.round(match.height)) {
      issues.push({
        prop: 'height',
        expected: node.height,
        actual: match.height,
        message: `Height mismatch: expected ${node.height}px, got ${match.height}px`
      });
    }

    if (node.fontSize && match.fontSize && Math.round(node.fontSize) !== Math.round(match.fontSize)) {
      issues.push({
        prop: 'fontSize',
        expected: node.fontSize,
        actual: match.fontSize,
        message: `Font size mismatch: expected ${node.fontSize}px, got ${match.fontSize}px`
      });
    }

    report.push({
      figmaId: node.id,
      figmaName: node.name,
      text: node.characters,
      domTag: match.tag,
      status: issues.length ? 'DIFFERENT' : 'MATCH',
      issues
    });
  }

  const outPath = path.join(__dirname, '..', 'artifacts', 'compare-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Saved compare report to', outPath);
}

main();
