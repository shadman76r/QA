import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCompareReport() {
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

function escapeCsv(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(report) {
  const header = [
    'Status',
    'FigmaText',
    'FigmaName',
    'FigmaId',
    'DomTag',
    'IssueProp',
    'Expected',
    'Actual',
    'IssueMessage',
    'ScreenshotPath'
  ];

  const rows = [header];

  report.forEach(item => {
    if (item.status === 'DIFFERENT' && item.issues && item.issues.length) {
      item.issues.forEach(issue => {
        rows.push([
          item.status,
          item.text || '',
          item.figmaName || '',
          item.figmaId || '',
          item.domTag || '',
          issue.prop || '',
          issue.expected ?? '',
          issue.actual ?? '',
          issue.message || '',
          item.screenshotPath || ''
        ]);
      });
    } else if (item.status === 'MISSING_IN_DOM') {
      rows.push([
        item.status,
        item.text || '',
        item.figmaName || '',
        item.figmaId || '',
        '',
        '',
        '',
        '',
        'Text exists in Figma but not found on page',
        ''
      ]);
    }
  });

  return rows.map(row => row.map(escapeCsv).join(',')).join('\n');
}

function main() {
  const report = loadCompareReport();
  const csv = buildCsv(report);

  const outPath = path.join(__dirname, '..', 'artifacts', 'qa-work-report.csv');
  fs.writeFileSync(outPath, csv, 'utf8');
  console.log('Saved QA work CSV to', outPath);
}

main();
