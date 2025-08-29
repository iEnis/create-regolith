import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import Wrapper from "./Wrapper.js";
import paths from "./paths.js";
import pc from "picocolors";
import { v4 } from "uuid";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const zx: typeof import("zx").$ = require("zx").$;

const prealphaVersion = "3.0.0-alpha";

async function $(cmd: string | TemplateStringsArray, options?: { log?: boolean }, ...substitutions: any[]): Promise<string> {
    zx.prefix = "";
    zx.quote = (x) => pc.yellow(x);

    let result;

    if (typeof cmd === "string") result = await zx`${cmd}`;
    else result = await zx(cmd, ...substitutions);

    const stdout = result.stdout;
    if (options?.log) console.log(stdout);
    return stdout;
}

type installParams = {
    author: string;
    name: string;
    description: string;
    beta: boolean;
    prealpha: boolean;
    modules: string[];
    utils: string[];
};

export default async function install(params: installParams) {
    function cfg(esbuild: boolean) {
        const config = JSON.parse(readFileSync(paths.node("/modules/config.json")).toString());
        config.name = params.name;
        config.author = params.author;
        if (esbuild) {
            config.regolith.filterDefinitions.build = {
                runWith: "nodejs",
                script: "filters/build/build.js",
            };
            config.regolith.filterDefinitions.bundle = {
                runWith: "nodejs",
                script: "filters/build/bundle.js",
            };
            for (const profile of ["default", "build", "bundle"]) {
                config.regolith.profiles[profile].filters.push({ filter: profile === "build" ? "build" : "bundle" });
            }
        }
    }

    let modules: { module: string; version: string }[] = [];
    Wrapper.spinner("Getting Latest '@minecraft/server' versions", async () => {
        for (const x of params.modules) {
            modules.push({
                module: x,
                version: await getLatestVersion(x, params.beta ? "beta" : "stable"),
            });
        }
        return true;
    });

    Wrapper.spinner("Creating Directories", async () => {
        mkdirSync(paths.exec("/.regolith/cache"), { recursive: true });
        mkdirSync(paths.exec("/.regolith/tmp"), { recursive: true });
        mkdirSync(paths.exec("/packs/BP/scripts"), { recursive: true });
        mkdirSync(paths.exec("/filters/dynamic"), { recursive: true });
        return true;
    });

    Wrapper.spinner("Creating and Copying files", async () => {
        copyFileSync(paths.node("/modules/dynamic.js"), paths.exec("/filters/dynamic/dynamic.js"));

        const BP = JSON.parse(readFileSync(paths.node("/modules/BP.json")).toString());
        const RP = JSON.parse(readFileSync(paths.node("/modules/RP.json")).toString());

        const packageJSON = JSON.parse(readFileSync(paths.node("/modules/package.json")).toString());
        packageJSON.name = params.name;
        packageJSON.author = params.author;
        if (params.description.length > 0) packageJSON.description = params.description;

        const uuid = {
            bpHeader: v4(),
            data: v4(),
            script: v4(),
            rpHeader: v4(),
            resources: v4(),
        };

        BP.header.uuid = uuid.bpHeader;
        BP.modules[0].uuid = uuid.data;
        BP.modules[1].uuid = uuid.script;
        BP.dependencies[0].uuid = uuid.rpHeader;

        RP.header.uuid = uuid.rpHeader;
        RP.modules[0].uuid = uuid.resources;
        RP.dependencies[0].uuid = uuid.bpHeader;

        if (params.utils.includes("typescript")) {
            packageJSON.devDependencies.typescript = "latest";
            packageJSON.devDependencies["@types/node"] = "latest";
        }
        if (params.utils.includes("esbuild")) {
            packageJSON.devDependencies.esbuild = "^0.25.9";
            packageJSON.devDependencies.globby = "^14.1.0";
        }

        for (const module of modules) {
            BP.dependencies.push({
                module_name: module.module,
                version: params.beta && params.prealpha ? prealphaVersion : module.version,
            });
            packageJSON.devDependencies[module.module] = `^${module.version}`;
        }

        for (const pack of [RP, BP]) {
            pack.header.name = params.name;
            pack.header.description = params.description;
        }

        writeFileSync(paths.exec("/filters/dynamic/BP.json"), JSON.stringify(BP));
        writeFileSync(paths.exec("/filters/dynamic/RP.json"), JSON.stringify(RP));
        writeFileSync(paths.exec("package.json"), JSON.stringify(packageJSON));

        return true;
    });

    if (params.utils.includes("typescript"))
        Wrapper.spinner("Adding Typescript", async () => {
            mkdirSync(paths.exec("/packs/data/src"), { recursive: true });
            writeFileSync(paths.exec("/packs/data/src/index.ts"), 'console.log("Test");');
            copyFileSync(paths.node("/modules/tsconfig.json"), paths.exec("/packs/data/src"));
            return true;
        });

    if (params.utils.includes("esbuild"))
        Wrapper.spinner("Adding esBuild", async () => {
            const ts = params.utils.includes("typescript");
            const NAMESPACE = params.utils.includes("typescript") ? "packs/data/src" : "packs/BP/scripts";
            const ENTRYPOINT = params.utils.includes("typescript")
                ? `/data/src/index.${ts ? "ts" : "js"}`
                : `/BP/scripts/index.${ts ? "ts" : "js"}`;

            mkdirSync(paths.exec("/filters/build"), { recursive: true });
            writeFileSync(
                paths.exec("/filters/build/build.js"),
                readFileSync(paths.node("/modules/build.js")).toString().replaceAll("%NAMESPACE%", NAMESPACE),
            );
            writeFileSync(
                paths.exec("/filters/build/bundle.js"),
                readFileSync(paths.node("/modules/bundle.js")).toString().replaceAll("%ENTRYPOINT%", ENTRYPOINT),
            );
            copyFileSync(paths.node("/modules/shared.js"), paths.exec("/filters/build/shared.js"));

            return true;
        });
}

async function getLatestVersion(module: string, type: "beta" | "stable") {
    const data = await (await fetch(`https://registry.npmjs.org/${module}`)).json();
    const versions = Object.keys(data.versions);

    if (type === "beta") {
        const betaVersions = versions
            .filter((x) => x.includes("stable"))
            .map((x) => [x, x.split("-")[1].replace("beta.", "")]);
        return getMaxVersion(betaVersions)[0];
    } else if (type === "stable") {
        const stableVersions = versions.filter((x) => /^\d+\.\d+\.\d+$/.test(x)).map((x) => [x, x]);
        return getMaxVersion(stableVersions)[0];
    } else throw new Error("Something bad happened");
}

function getMaxVersion(versions: string[][]) {
    return versions.sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true })).pop() as [string, string];
}
