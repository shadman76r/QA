const fs = require('fs');
const path = require('path');

async function main() {
  const fileKey = process.argv[2];
  const nodeId = process.argv[3];
  const figmaToken = process.argv[4];

  if (!fileKey || !nodeId || !figmaToken) {
    console.error('Usage: node scripts/fetchFigmaFrame.js <FILE_KEY> <NODE_ID> <FIGMA_TOKEN>');
    process.exit(1);
  }

  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir);
  }

  const apiUrl =
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png`;

  const res = await fetch(apiUrl, {
    headers: { 'X-Figma-Token': figmaToken }
  });

  if (!res.ok) {
    console.error('Figma API error:', res.status);
    console.error(await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const imageUrl = data.images[nodeId];

  if (!imageUrl) {
    console.error('No image URL for this node. Check FILE_KEY and NODE_ID.');
    process.exit(1);
  }

  const imgRes = await fetch(imageUrl);
  const arrayBuffer = await imgRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outPath = path.join(artifactsDir, 'figma-frame.png');
  fs.writeFileSync(outPath, buffer);
  console.log('Saved Figma frame PNG to:', outPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
