// import fs from 'fs';
// import path from 'path';
// import { PNG } from 'pngjs';
// import pixelmatch from 'pixelmatch';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function loadPng(filePath) {
//   const data = fs.readFileSync(filePath);
//   return PNG.sync.read(data);
// }

// function savePng(png, filePath) {
//   const buffer = PNG.sync.write(png);
//   fs.writeFileSync(filePath, buffer);
// }

// function main() {
//   const artifactsDir = path.join(__dirname, '..', 'artifacts');
//   const figmaPath = path.join(artifactsDir, 'figma-frame.png');
//   const livePath = path.join(artifactsDir, 'live-page.png');

//   if (!fs.existsSync(figmaPath) || !fs.existsSync(livePath)) {
//     console.error('Missing figma-frame.png or live-page.png in artifacts folder');
//     process.exit(1);
//   }

//   const img1 = loadPng(figmaPath);
//   const img2 = loadPng(livePath);

//   const width = Math.min(img1.width, img2.width);
//   const height = Math.min(img1.height, img2.height);

//   const diff = new PNG({ width, height });

//   const img1Cropped = new PNG({ width, height });
//   const img2Cropped = new PNG({ width, height });

//   PNG.bitblt(img1, img1Cropped, 0, 0, width, height, 0, 0);
//   PNG.bitblt(img2, img2Cropped, 0, 0, width, height, 0, 0);

//   const diffPixels = pixelmatch(
//     img1Cropped.data,
//     img2Cropped.data,
//     diff.data,
//     width,
//     height,
//     { threshold: 0.1 }
//   );

//   const diffPath = path.join(artifactsDir, 'diff.png');
//   savePng(diff, diffPath);

//   const totalPixels = width * height;
//   const diffPercent = (diffPixels / totalPixels) * 100;

//   console.log('Compared size:', width, 'x', height);
//   console.log('Mismatched pixels:', diffPixels);
//   console.log('Difference %:', diffPercent.toFixed(2) + '%');
//   console.log('Diff image saved to:', diffPath);
// }

// main();
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadPng(filePath) {
  const data = fs.readFileSync(filePath);
  return PNG.sync.read(data);
}

function main() {
  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  const figmaPath = path.join(artifactsDir, 'figma-frame.png');
  const livePath = path.join(artifactsDir, 'live-page.png');

  if (!fs.existsSync(figmaPath) || !fs.existsSync(livePath)) {
    console.error('Missing figma-frame.png or live-page.png in artifacts folder');
    process.exit(1);
  }

  const figmaImg = loadPng(figmaPath);
  const liveImg  = loadPng(livePath);

  console.log('Figma size :', figmaImg.width, 'x', figmaImg.height);
  console.log('Live size  :', liveImg.width,  'x', liveImg.height);

  const issues = [];

  if (figmaImg.width !== liveImg.width) {
    issues.push({
      type: 'WIDTH_MISMATCH',
      expected: figmaImg.width,
      actual: liveImg.width,
      message: `Width mismatch: expected ${figmaImg.width}px, got ${liveImg.width}px`
    });
  }

  if (figmaImg.height !== liveImg.height) {
    issues.push({
      type: 'HEIGHT_MISMATCH',
      expected: figmaImg.height,
      actual: liveImg.height,
      message: `Height mismatch: expected ${figmaImg.height}px, got ${liveImg.height}px`
    });
  }

  if (issues.length === 0) {
    console.log('Sizes match exactly. No size issues.');
  } else {
    console.log('Size issues found:');
    console.log(JSON.stringify(issues, null, 2));
  }
}

main();
