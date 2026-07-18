import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));

await mkdir(join(root, "dist"), { recursive: true });

await copyFile(join(root, "manifest.json"), join(root, "dist", "manifest.json"));
await copyFile(join(root, "src", "content.css"), join(root, "dist", "content.css"));
await copyFile(join(root, "src", "popup.html"), join(root, "dist", "popup.html"));
await copyFile(join(root, "src", "popup.css"), join(root, "dist", "popup.css"));
