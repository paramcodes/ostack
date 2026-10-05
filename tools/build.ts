import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

console.log("Building TypeScript...");
execSync("bun run tsc", { stdio: "inherit" });

console.log("Ensuring bin/ostack.mjs is executable...");
fs.chmodSync(path.resolve("bin/ostack.mjs"), 0o755);

console.log("Build complete!");
