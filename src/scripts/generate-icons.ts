import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const svgContent = readFileSync(join(process.cwd(), "public/favicon.svg"), "utf-8");

const sizes = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon.ico", size: 32 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
];

for (const { name, size } of sizes) {
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: "width",
      value: size,
    },
  });
  const png = resvg.render().asPng();
  writeFileSync(join(process.cwd(), "public", name), new Uint8Array(png));
}

console.log("Icons generated successfully!");
