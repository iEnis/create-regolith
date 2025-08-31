import { copyFileSync, readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { exec } from "child_process";
import Wrapper from "./Wrapper.js";
import paths from "./paths.js";
import { v4 } from "uuid";

const $ = (cmd: string) =>
    new Promise((r) =>
        exec(cmd, { cwd: paths.exec(), shell: "cmd.exe", env: { ...process.env, NODE_PATH: "" } }, () => {}).on("close", r),
    );

const npmPATH = process.env.PATH?.split(";")
    .find((x) => {
        if (!x.includes("npm")) return;
        const splitted = x.split("\\");
        const str = splitted[splitted.length - 1];
        if (str !== "npm") return;
        return x;
    })
    ?.concat("\\npm");

const prealphaVersion = "3.0.0-alpha";

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
    const utils = {
        "typesafe-mc": params.utils.includes("typesafe-mc"),
        typescript: params.utils.includes("typescript"),
        esbuild: params.utils.includes("esbuild"),
    };

    function cfg() {
        const config = JSON.parse(readFileSync(paths.node("/modules/config.json")).toString());
        config.name = params.name;
        config.author = params.author;
        if (utils.esbuild) {
            config.regolith.profiles.build = {
                export: {
                    build: "standard",
                    readOnly: false,
                    target: "development",
                    bpName: "project.name + ' - BP'",
                    rpName: "project.name + ' - RP'",
                },
                filters: [
                    { filter: "dynamic", arguments: ["increase"], when: "mode == 'build'" },
                    { filter: "dynamic", when: "mode == 'watch'" },
                ],
            };
            config.regolith.profiles.bundle = {
                export: {
                    build: "standard",
                    readOnly: false,
                    target: "development",
                    bpName: "project.name + ' - BP'",
                    rpName: "project.name + ' - RP'",
                },
                filters: [
                    { filter: "dynamic", arguments: ["increase"], when: "mode == 'build'" },
                    { filter: "dynamic", when: "mode == 'watch'" },
                ],
            };
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
        } else if (utils.typescript) {
            config.regolith.filterDefinitions.build = {
                runWith: "nodejs",
                script: "filters/build/tsconfig.js",
            };
            config.regolith.profiles.default.filters.push({
                filter: "build",
            });
        }
        writeFileSync(paths.exec("config.json"), JSON.stringify(config));
    }

    let modules: { module: string; version: string }[] = [];
    await Wrapper.spinner("Getting Latest '@minecraft/server' versions", async () => {
        for (const x of params.modules) {
            modules.push({
                module: x,
                version: await getLatestVersion(x, params.beta ? "beta" : "stable"),
            });
        }
        return true;
    });

    await Wrapper.spinner("Creating Directories", async () => {
        mkdirSync(paths.exec("/.regolith/cache/venvs"), { recursive: true });
        mkdirSync(paths.exec("/.regolith/tmp"), { recursive: true });
        mkdirSync(paths.exec("/packs/BP/scripts"), { recursive: true });
        mkdirSync(paths.exec("/packs/data"), { recursive: true });
        mkdirSync(paths.exec("/packs/RP"), { recursive: true });
        mkdirSync(paths.exec("/filters/dynamic"), { recursive: true });
        if (utils["typesafe-mc"]) mkdirSync(paths.exec("/utils/"), { recursive: true });
        return true;
    });

    await Wrapper.spinner("Creating and Copying files", async () => {
        copyFileSync(paths.node("/modules/dynamic.js"), paths.exec("/filters/dynamic/dynamic.js"));
        copyFileSync(paths.node("/modules/regolith.exe"), paths.exec("/regolith.exe"));
        copyFileSync(paths.node("/modules/.gitignoreFile"), paths.exec("/.gitignore"));
        if (!utils["esbuild"]) cfg();

        const BP = JSON.parse(readFileSync(paths.node("/modules/BP.json")).toString());
        const RP = JSON.parse(readFileSync(paths.node("/modules/RP.json")).toString());

        const packageJSON = JSON.parse(readFileSync(paths.node("/modules/package.json")).toString());
        packageJSON.name = params.name.toLowerCase().replace(/\s+/g, "-");
        packageJSON.author = params.author;
        packageJSON.version = "0.0.1";
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

        if (utils["typescript"]) {
            packageJSON.devDependencies.typescript = "latest";
            packageJSON.devDependencies["@types/node"] = "latest";
        }
        if (utils["typesafe-mc"]) {
            packageJSON.devDependencies["typesafe-mc"] = "latest";
            packageJSON.scripts["tsmc"] = "node node_modules/typesafe-mc/scripts/index.js";
        }
        if (utils["esbuild"]) {
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

    await Wrapper.spinner("Installing node_modules", async () => {
        writeFileSync(paths.node("/modules/install.bat"), `@echo off\ncd "${paths.exec()}"\n"${npmPATH}" i`);
        await $(paths.node("/modules/install.bat"));
        return true;
    });

    if (utils["typescript"])
        await Wrapper.spinner("Adding Typescript", async () => {
            mkdirSync(paths.exec("/packs/data/src"), { recursive: true });
            writeFileSync(paths.exec("/packs/data/src/index.ts"), 'console.log("Hello World!");');
            copyFileSync(paths.node("/modules/tsconfig.json"), paths.exec("/packs/data/src/tsconfig.json"));
            return true;
        });
    else if (utils.esbuild) {
        mkdirSync(paths.exec("/packs/data/src"), { recursive: true });
        writeFileSync(paths.exec("/packs/data/src/index.js"), 'console.log("Hello World!");');
    } else writeFileSync(paths.exec("/packs/BP/scripts/index.js"), 'console.log("Hello World!");');

    if (utils["esbuild"])
        await Wrapper.spinner("Adding esBuild", async () => {
            cfg();
            const ts = utils["typescript"];
            const NAMESPACE = "../../packs/data/src";
            const ENTRYPOINT = `data/src/index.${ts ? "ts" : "js"}`;

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
    else if (utils.typescript) {
        mkdirSync(paths.exec("filters/build"), { recursive: true });
        copyFileSync(paths.node("/modules/build.bat"), paths.exec("filters/build/build.bat"));
        copyFileSync(paths.node("/modules/tsconfig.js"), paths.exec("filters/build/tsconfig.js"));
    }

    if (utils["typesafe-mc"])
        await Wrapper.spinner("Adding Typesafe-MC", async () => {
            const tsmc: (targetPath: string) => void = (
                await import("file:\\\\" + paths.exec("node_modules/typesafe-mc/scripts/cmd.js"))
            ).default;
            tsmc(paths.exec(""));
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

export function checkEmpty() {
    return !(readdirSync(paths.exec()).length > 0);
}
