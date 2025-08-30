import path from "path";

export const data = {
    outdir: path.join(import.meta.dirname, "../../.regolith/tmp/BP/scripts"),
    platform: "node",
    format: "esm",
    target: "es2022",
    sourcemap: false,
    logLevel: "info",
};
