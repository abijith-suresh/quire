import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";

const svg = readFileSync("public/favicon.svg", "utf-8");

const ico = new Resvg(svg, { fitTo: { mode: "width", value: 32 } });
writeFileSync("public/favicon.ico", ico.render().asPng());
console.log("favicon.ico written (32×32 PNG)");

const touch = new Resvg(svg, { fitTo: { mode: "width", value: 180 } });
writeFileSync("public/apple-touch-icon.png", touch.render().asPng());
console.log("apple-touch-icon.png written (180×180 PNG)");
