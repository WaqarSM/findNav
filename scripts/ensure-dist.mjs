import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const requiredFiles = [
  "manifest.json",
  "content.js",
  "content.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
];
const missing = [];

for (const file of requiredFiles) {
  try {
    await access(join(root, "dist", file));
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error(`Missing release files in dist/: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("dist/ contains the required FindNav release files.");
