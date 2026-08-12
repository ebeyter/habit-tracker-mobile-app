// Dev-time only: generates the 3D mascot renders via fal.ai (one per animal x mood)
// and saves them into assets/mascot/. Never called at runtime by the app itself.
//
// Usage: node --env-file=.env scripts/generate-mascot-art.mjs [animalId ...]

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
  '3D rendered cute cartoon mascot character, Pixar animation style, glossy soft plastic toy look, ' +
  'big expressive friendly eyes, soft studio lighting, subtle rim light, full body, centered composition, ' +
  'solid plain white background, no text, no watermark';

const ANIMALS = [
  { id: 'owl', subject: 'wise friendly owl wearing tiny round glasses' },
  { id: 'dog', subject: 'loyal happy golden puppy' },
  { id: 'fox', subject: 'clever orange fox' },
  { id: 'cat', subject: 'sweet fluffy grey cat' },
  { id: 'panda', subject: 'chubby cheerful panda' },
  { id: 'rabbit', subject: 'soft white rabbit with long ears' },
];

const MOODS = [
  { id: 'neutral', pose: 'calm friendly expression, sitting upright, small encouraging smile' },
  { id: 'happy', pose: 'joyful big smile, cheering with both arms raised, celebrating' },
  { id: 'sad', pose: 'sad droopy expression, ears down, slouched, one small tear' },
];

function buildJobs(filterIds) {
  const animals = filterIds.length
    ? ANIMALS.filter((a) => filterIds.includes(a.id))
    : ANIMALS;
  return animals.flatMap((animal) =>
    MOODS.map((mood) => ({
      id: `${animal.id}-${mood.id}`,
      prompt: `${STYLE}, a ${animal.subject}, ${mood.pose}`,
    }))
  );
}

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
      output_format: 'png',
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

  // Android's AAPT rejects a JPEG that merely carries a .png extension, so refuse to write
  // one — Metro and iOS tolerate the mismatch and the failure only surfaces at build time.
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isPng) {
    throw new Error(
      `fal.ai returned a non-PNG image for "${pose.id}". Convert it before committing, e.g.\n` +
        `  sips -s format png -Z 256 <file> --out assets/mascot/${pose.id}.png`
    );
  }

  const outPath = path.join(OUT_DIR, `${pose.id}.png`);
  await writeFile(outPath, buffer);
  console.log(`Saved ${outPath}`);
}

await mkdir(OUT_DIR, { recursive: true });
const jobs = buildJobs(process.argv.slice(2));
for (const [i, job] of jobs.entries()) {
  console.log(`[${i + 1}/${jobs.length}] Generating "${job.id}"...`);
  await generate(job);
}
console.log('Done.');
