import path from "path";

/** @type {import("esbuild").BuildOptions} */
const buildOptions = {
    entryPoints: [path.join(import.meta.dirname, "../src/index.ts")],
    bundle: true,
    minify: true,
    outfile: path.join(import.meta.dirname, "../app.js"),
    platform: "node",
    format: "esm",
    target: "es2022",
    sourcemap: false,
    logLevel: "info",
};

export default buildOptions;
