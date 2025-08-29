import { data } from "./shared.js";

import { build } from "esbuild";
import path from "path";

await build({
    ...data,
    entryPoints: [path.join(import.meta.dirname, "../packs/%ENTRYPOINT%")],
    bundle: true,
    minify: true,
});
