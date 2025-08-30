import { data } from "./shared.js";

import { build } from "esbuild";
import path from "path";

await build({
    ...data,
    entryPoints: [path.join(import.meta.dirname, "../../packs/%ENTRYPOINT%")],
    bundle: true,
    minify: true,
    packages: "bundle",
    external: [
        "@minecraft/server",
        "@minecraft/server-ui",
        "@minecraft/server-gametest",
        "@minecraft/server-net",
        "@minecraft/server-admin",
    ],
});
