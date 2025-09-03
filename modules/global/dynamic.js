import { readFileSync, writeFileSync, copyFileSync } from "fs";
import path from "path";

const regolith = (...paths) => path.join(import.meta.dirname, "../../.regolith/tmp", ...paths);
const root = (...paths) => path.join(import.meta.dirname, "../../", ...paths);

const packageJSON = JSON.parse(readFileSync(root("package.json")).toString());
const BP = JSON.parse(readFileSync(root("/filters/dynamic/BP.json")).toString());
const RP = JSON.parse(readFileSync(root("/filters/dynamic/RP.json")).toString());

for (const pack of [BP, RP]) {
    const isBP = !!pack.modules.find((x) => x.type === "data");
    const uuid = isBP ? RP.header.uuid : BP.header.uuid;

    pack.header.name = packageJSON.name;
    if (packageJSON.description) pack.header.description = packageJSON.description ?? "No description set";
    pack.header.version = packageJSON.version;
    pack.dependencies.find((x) => x.uuid === uuid).version = packageJSON.version;

    if (isBP) {
        for (const [i, dep] of pack.dependencies.entries()) {
            if (!("module_name" in dep)) continue;
            pack.dependencies[i].version = packageJSON.devDependencies[dep.module_name].split("-")[0].replace("^", "");
        }
    }

    writeFileSync(regolith(`${isBP ? "BP" : "RP"}/manifest.json`), JSON.stringify(pack));
}

if (!process.argv.includes("increase")) process.exit();

let version = packageJSON.version;
version = version.split(".");
version[version.length - 1] = `${Number(version[version.length - 1]) + 1}`;
version = version.join(".");
packageJSON.version = version;
writeFileSync(root("package.json"), JSON.stringify(packageJSON));
