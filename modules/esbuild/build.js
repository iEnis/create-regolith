import { data } from "./shared.js";

import { build } from "esbuild";
import { globby } from "globby";

const entryPoints = [...await globby("%NAMESPACE%/**/*.ts"), ...await globby("%NAMESPACE%/**/*.js")];

await build({
    ...data,
    entryPoints,
    bundle: false,
});
