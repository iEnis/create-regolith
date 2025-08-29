import path from "path";

export const data = {
    outdir: path.join(import.meta.dirname, "../../BP/scripts"),
    platform: "node",
    format: "esm",
    target: "es2022",
    sourcemap: false,
    logLevel: "info",
    external: [
        "@minecraft/server",
        "@minecraft/server-ui",
        "@minecraft/server-gametest",
        "@minecraft/server-net",
        "@minecraft/server-admin",
    ],
};
