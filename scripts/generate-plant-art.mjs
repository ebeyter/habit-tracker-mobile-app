// Dev-time only: generates the plant growth-stage renders for the Identity Garden via
// fal.ai and saves them into assets/plants/. Never called at runtime by the app itself.
//
// Usage: node --env-file=.env scripts/generate-plant-art.mjs [stageId ...]

import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY not set. Fill it into .env, then run:');
  console.error('  node --env-file=.env scripts/generate-plant-art.mjs');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'assets', 'plants');

const STYLE =
  '3D rendered cute cartoon plant, Pixar animation style, glossy soft clay look, ' +
  'growing out of a small round terracotta pot, soft studio lighting, centered composition, ' +
  'solid plain white background, no text, no watermark';

const STAGES = [
  { id: 'seed', prompt: `${STYLE}, just a bare pot with dark soil and a single seed on top` },
  { id: 'sprout', prompt: `${STYLE}, tiny green sprout with two small leaves poking out of the soil` },
  { id: 'seedling', prompt: `${STYLE}, small young plant with several fresh green leaves` },
  { id: 'budding', prompt: `${STYLE}, healthy leafy plant with a few closed flower buds` },
  { id: 'blooming', prompt: `${STYLE}, lush plant in full bloom with bright colorful flowers` },
  { id: 'wilted', prompt: `${STYLE}, drooping wilted plant with dry yellow-brown curling leaves, sad neglected look` },
];

async function generate(stage) {
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: stage.prompt,
      image_size: 'square_hd',
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'png',
    }),
  });

  if (!res.ok) {
    throw new Error(`fal.ai request failed for "${stage.id}": ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const imageUrl = json?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error(`No image URL in fal.ai response for "${stage.id}": ${JSON.stringify(json)}`);
  }

  const imgRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // Android's AAPT rejects a JPEG that merely carries a .png extension.
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isPng) {
    throw new Error(`fal.ai returned a non-PNG image for "${stage.id}"; convert before committing.`);
  }

  const outPath = path.join(OUT_DIR, `${stage.id}.png`);
  await writeFile(outPath, buffer);
  console.log(`Saved ${outPath}`);
}

await mkdir(OUT_DIR, { recursive: true });
const filter = process.argv.slice(2);
const jobs = filter.length ? STAGES.filter((s) => filter.includes(s.id)) : STAGES;
for (const [i, stage] of jobs.entries()) {
  console.log(`[${i + 1}/${jobs.length}] Generating "${stage.id}"...`);
  await generate(stage);
}
console.log('Done.');
