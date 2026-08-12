// Dev-time only: generates the 3 mascot pose illustrations via fal.ai and saves
// them into assets/mascot/. Never called at runtime by the app itself.
//
// Usage: node --env-file=.env scripts/generate-mascot-art.mjs

import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY not set. Fill it into .env, then run:');
  console.error('  node --env-file=.env scripts/generate-mascot-art.mjs');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'assets', 'mascot');

const STYLE =
  'cute flat vector illustration, friendly orange fox mascot character, big round eyes, ' +
  'simple flat colors, thick clean black outlines, sticker style, centered composition, ' +
  'solid plain white background, no text, no shadow, no watermark';

const POSES = [
  { id: 'neutral', prompt: `${STYLE}, calm neutral expression, sitting pose` },
  { id: 'happy', prompt: `${STYLE}, joyful big smile, cheering pose with paws up` },
  { id: 'sad', prompt: `${STYLE}, sad droopy expression, slouched pose, one small tear` },
];

async function generate(pose) {
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: pose.prompt,
      image_size: 'square_hd',
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`fal.ai request failed for "${pose.id}": ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const imageUrl = json?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error(`No image URL in fal.ai response for "${pose.id}": ${JSON.stringify(json)}`);
  }

  const imgRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const outPath = path.join(OUT_DIR, `${pose.id}.png`);
  await writeFile(outPath, buffer);
  console.log(`Saved ${outPath}`);
}

await mkdir(OUT_DIR, { recursive: true });
for (const pose of POSES) {
  console.log(`Generating "${pose.id}"...`);
  await generate(pose);
}
console.log('Done.');
