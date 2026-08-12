// Dev-time only: generates the plant / tree renders for the garden and forest via fal.ai,
// strips their backgrounds, and saves transparent PNGs into assets/plants/.
// Never called at runtime by the app itself.
//
// Usage: node --env-file=.env scripts/generate-plant-art.mjs [id ...]

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
  'soft studio lighting, centered composition, solid plain white background, no text, no watermark';

const POT = 'growing out of a small round terracotta pot';

const SUBJECTS = [
  { id: 'seed', prompt: `${STYLE}, ${POT}, bare dark soil with a single seed resting on top` },
  { id: 'sprout', prompt: `${STYLE}, ${POT}, tiny green sprout with two small leaves` },
  { id: 'seedling', prompt: `${STYLE}, ${POT}, small young plant with several fresh green leaves` },
  { id: 'budding', prompt: `${STYLE}, ${POT}, healthy leafy plant with a few closed flower buds` },
  { id: 'blooming', prompt: `${STYLE}, ${POT}, lush plant in full bloom with bright colorful flowers` },
  { id: 'wilted', prompt: `${STYLE}, ${POT}, drooping wilted plant, dry curling yellow-brown leaves` },
];

/**
 * Forest inhabitants are rendered photorealistically instead of in the clay style, so they
 * sit convincingly in the photographic meadow backdrop rather than reading as stickers.
 */
const REAL_TREE_STYLE =
  'photorealistic tree, isolated on a plain white background, full tree with visible trunk and ' +
  'root base, warm golden hour sunlight from the right, soft natural shadows, highly detailed ' +
  'bark texture and individual leaves, sharp focus, professional nature photography, ' +
  'no people, no text, no watermark';

const TREES = [
  { id: 'tree-oak', prompt: `${REAL_TREE_STYLE}, a mature broad oak tree with a wide leafy green canopy` },
  { id: 'tree-pine', prompt: `${REAL_TREE_STYLE}, a tall evergreen pine tree with dense dark green needles` },
  { id: 'tree-blossom', prompt: `${REAL_TREE_STYLE}, a flowering cherry blossom tree covered in pale pink blossoms` },
];

/** Scenery for the forest tab: the backdrop keeps its background, the props are cut out. */
const SCENERY = [
  {
    id: 'forest-bg',
    keepBackground: true,
    imageSize: 'landscape_4_3',
    prompt:
      '3D rendered Pixar style illustration of an empty peaceful meadow at golden hour, ' +
      'rolling green hills, soft distant forest silhouette on the horizon, warm dusk sky with ' +
      'gentle clouds, wide open grassy foreground with no trees in front, no characters, ' +
      'no text, no watermark',
  },
  {
    id: 'bush',
    prompt: `${REAL_TREE_STYLE}, a small round leafy green shrub`,
  },
  {
    id: 'rock',
    prompt: `${REAL_TREE_STYLE}, a small mossy grey boulder`,
  },
];

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function callFal(endpoint, body) {
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`fal.ai ${endpoint} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function generate(subject) {
  const generated = await callFal('fal-ai/flux/schnell', {
    prompt: subject.prompt,
    image_size: subject.imageSize ?? 'square_hd',
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
    output_format: 'png',
  });

  const rawUrl = generated?.images?.[0]?.url;
  if (!rawUrl) throw new Error(`No image URL for "${subject.id}": ${JSON.stringify(generated)}`);

  let finalUrl = rawUrl;
  if (!subject.keepBackground) {
    // Cut the plate out so the art can sit directly on any background in the app.
    const cutout = await callFal('fal-ai/imageutils/rembg', { image_url: rawUrl });
    finalUrl = cutout?.image?.url ?? cutout?.images?.[0]?.url;
    if (!finalUrl) throw new Error(`No cutout URL for "${subject.id}": ${JSON.stringify(cutout)}`);
  }

  const imgRes = await fetch(finalUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());

  // Android's AAPT rejects a JPEG that merely carries a .png extension.
  if (!buffer.subarray(0, 8).equals(PNG_MAGIC)) {
    throw new Error(`fal.ai returned a non-PNG image for "${subject.id}"; convert before committing.`);
  }

  const outPath = path.join(OUT_DIR, `${subject.id}.png`);
  await writeFile(outPath, buffer);
  console.log(`Saved ${outPath}`);
}

await mkdir(OUT_DIR, { recursive: true });
const ALL = [...SUBJECTS, ...TREES, ...SCENERY];
const filter = process.argv.slice(2);
const jobs = filter.length ? ALL.filter((s) => filter.includes(s.id)) : ALL;
for (const [i, job] of jobs.entries()) {
  console.log(`[${i + 1}/${jobs.length}] Generating "${job.id}"...`);
  await generate(job);
}
console.log('Done.');
