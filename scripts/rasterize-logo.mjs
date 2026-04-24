import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const svg = await readFile("public/noctura-mark.svg");

const sizes = [
  { name: "public/noctura-logo.png", size: 660 },
  { name: "public/noctura-logo@2x.png", size: 1320 },
];

for (const { name, size } of sizes) {
  const buf = await sharp(svg)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(name, buf);
  console.log(
    `✓ ${name} — ${size}×${size}px, ${(buf.length / 1024).toFixed(1)} KB`,
  );
}
