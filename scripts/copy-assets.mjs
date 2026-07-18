import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const iconsDir = join(root, "src", "icons");
const distIconsDir = join(root, "dist", "icons");

await mkdir(join(root, "dist"), { recursive: true });
await mkdir(distIconsDir, { recursive: true });

await copyFile(join(root, "manifest.json"), join(root, "dist", "manifest.json"));
await copyFile(join(root, "src", "content.css"), join(root, "dist", "content.css"));
await copyFile(join(root, "src", "popup.html"), join(root, "dist", "popup.html"));
await copyFile(join(root, "src", "popup.css"), join(root, "dist", "popup.css"));

for (const file of await readdir(iconsDir)) {
  if (!file.endsWith(".png")) {
    continue;
  }

  await copyFile(join(iconsDir, file), join(distIconsDir, file));
}
