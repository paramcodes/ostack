#!/usr/bin/env node

// If running in development with TypeScript or compiled dist
try {
  const { main } = await import("../dist/cli.js");
  await main();
} catch (err) {
  // If dist is not built yet, fallback to bun/ts if available
  try {
    const { main } = await import("../src/cli.js");
    await main();
  } catch (innerErr) {
    console.error("Error launching ostack:", err.message);
    process.exit(1);
  }
}
