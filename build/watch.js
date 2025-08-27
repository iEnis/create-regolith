import { context } from "esbuild";
import buildOptions from "./shared.js";

const ctx = await context(buildOptions);

await ctx.watch();
console.log("Watching for Changes...");
