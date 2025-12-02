// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function loadCompareReport() {
//   const p = path.join(__dirname, '..', 'artifacts', 'compare-report.json');
//   return JSON.parse(fs.readFileSync(p, 'utf8'));
// }

// function buildMarkdown(report) {
//   const matches = report.filter(i => i.status === 'MATCH');
//   const diffs   = report.filter(i => i.status === 'DIFFERENT');
//   const missing = report.filter(i => i.status === 'MISSING_IN_DOM');

//   let md = '';

//   md += '# Figma vs Live QA Report\n\n';
//   md += '## Summary\n\n';
//   md += `- Total Figma texts: ${report.length}\n`;
//   md += `- Exact matches: ${matches.length}\n`;
//   md += `- Differences: ${diffs.length}\n`;
//   md += `- Missing in live DOM: ${missing.length}\n\n`;

//   if (diffs.length) {
//     md += '## Issues: Different Between Figma and Live\n\n';
//     diffs.forEach((item, index) => {
//       md += `### ${index + 1}. "${item.text}" (Figma: ${item.figmaName}, id: ${item.figmaId})\n`;
//       md += `- Status: DIFFERENT\n`;
//       if (item.domTag) {
//         md += `- Live element tag: \`${item.domTag}\`\n`;
//       }
//       md += '- Problems:\n';
//       item.issues.forEach(issue => {
//         md += `  - ${issue.message}\n`;
//       });
//       md += '\n';
//     });
//   }

//   if (missing.length) {
//     md += '## Issues: Present in Figma, Missing on Live\n\n';
//     missing.forEach((item, index) => {
//       md += `### M${index + 1}. "${item.text}" (Figma: ${item.figmaName}, id: ${item.figmaId})\n`;
//       md += `- Status: MISSING_IN_DOM\n`;
//       md += `- Detail: Text exists in Figma but not found anywhere on the page.\n\n`;
//     });
//   }

//   if (!diffs.length && !missing.length) {
//     md += '## Result\n\nAll Figma texts match size and font in the live page.\n';
//   }

//   return md;
// }

// function main() {
//   const report = loadCompareReport();
//   const markdown = buildMarkdown(report);

//   const outPath = path.join(__dirname, '..', 'artifacts', 'qa-report.md');
//   fs.writeFileSync(outPath, markdown, 'utf8');
//   console.log('Saved QA report to', outPath);
// }

// main();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCompareReport() {
  // use the version that includes screenshotPath
  const withShotsPath = path.join(
    __dirname,
    '..',
    'artifacts',
    'compare-report-with-shots.json'
  );

  const basePath = path.join(__dirname, '..', 'artifacts', 'compare-report.json');

  const filePath = fs.existsSync(withShotsPath) ? withShotsPath : basePath;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function buildMarkdown(report) {
  const matches = report.filter(i => i.status === 'MATCH');
  const diffs   = report.filter(i => i.status === 'DIFFERENT');
  const missing = report.filter(i => i.status === 'MISSING_IN_DOM');

  let md = '';

  md += '# Figma vs Live QA Report\n\n';
  md += '## Summary\n\n';
  md += `- Total Figma texts: ${report.length}\n`;
  md += `- Exact matches: ${matches.length}\n`;
  md += `- Differences: ${diffs.length}\n`;
  md += `- Missing in live DOM: ${missing.length}\n\n`;

  if (diffs.length) {
    md += '## Issues: Different Between Figma and Live\n\n';
    diffs.forEach((item, index) => {
      md += `### ${index + 1}. "${item.text}" (Figma: ${item.figmaName}, id: ${item.figmaId})\n`;
      md += `- Status: DIFFERENT\n`;
      if (item.domTag) {
        md += `- Live element tag: \`${item.domTag}\`\n`;
      }

      // Expected vs actual summary
      const expected = {};
      const actual = {};
      item.issues.forEach(issue => {
        expected[issue.prop] = issue.expected;
        actual[issue.prop] = issue.actual;
      });

      if (Object.keys(expected).length) {
        md += '- Expected (Figma):\n';
        Object.entries(expected).forEach(([k, v]) => {
          md += `  - ${k}: ${v}\n`;
        });
        md += '- Actual (Live):\n';
        Object.entries(actual).forEach(([k, v]) => {
          md += `  - ${k}: ${v}\n`;
        });
      }

      // Plain problem list
      md += '- Problems:\n';
      item.issues.forEach(issue => {
        md += `  - ${issue.message}\n`;
      });

      // Screenshot reference if we have one
      if (item.screenshotPath) {
        md += `- Screenshot file: ${item.screenshotPath}\n`;
      }

      md += '\n';
    });
  }

  if (missing.length) {
    md += '## Issues: Present in Figma, Missing on Live\n\n';
    missing.forEach((item, index) => {
      md += `### M${index + 1}. "${item.text}" (Figma: ${item.figmaName}, id: ${item.figmaId})\n`;
      md += `- Status: MISSING_IN_DOM\n`;
      md += `- Detail: Text exists in Figma but not found anywhere on the page.\n\n`;
    });
  }

  if (!diffs.length && !missing.length) {
    md += '## Result\n\nAll Figma texts match size and font in the live page.\n';
  }

  return md;
}

function main() {
  const report = loadCompareReport();
  const markdown = buildMarkdown(report);

  const outPath = path.join(__dirname, '..', 'artifacts', 'qa-work-report.md');
  fs.writeFileSync(outPath, markdown, 'utf8');
  console.log('Saved QA work report to', outPath);
}

main();

