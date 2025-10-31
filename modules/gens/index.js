import { readdirSync, existsSync, readFileSync, statSync } from "fs";
import { globby } from "globby";
import paths from "./paths.js";
import path from "path";
const packageJSON = JSON.parse(readFileSync(paths.root("package.json")));

/** @type {import("./types").Storage} */
const DATA = {
    blocks: [],
    items: [],
};

/** @type {(keyof typeof DATA)[]} */
const keys = Object.keys(DATA);

for (const author of readdirSync(paths.regolith("RP/textures"))) {
    if (!existsSync("RP/textures", packageJSON.author.toLowerCase())) {
        console.error(
            `Could not find author directory (package.json reference error), please verify that your textures are inside "RP/textures/${packageJSON.author.toLowerCase()}/projectName"`,
        );
        return process.exit();
    }
    if (!statSync(path.join(paths.regolith("RP/textures", author))).isDirectory()) continue;
    if (author !== packageJSON.author.toLowerCase()) continue;
    for (const project of readdirSync(path.join(paths.regolith("RP/textures", author)))) {
        if (!existsSync("RP/textures", author, packageJSON.name.toLowerCase())) {
            console.error(
                `Could not find project directory (package.json reference error), please verify that your textures are inside "RP/textures/${packageJSON.author.toLowerCase()}/${packageJSON.name.toLowerCase()}"`,
            );
            return process.exit();
        }
        if (!statSync(path.join(paths.regolith("RP/textures", author, project))).isDirectory()) continue;
        if (project !== packageJSON.name.toLowerCase()) continue;
        for (const type of keys) {
            const textures = await globby(`**/*.png`, { cwd: paths.regolith("RP/textures", author, project, type) });
            for (const texture of textures) {
                let name = texture.split("/");
                name = name[name.length - 1].replace(".png", "");

                DATA[type].push({
                    name,
                    path: `textures/${author}/${project}/${type}/${texture}`,
                    anim: texture.endsWith("_anim.png"),
                    tga: existsSync(
                        paths.regolith("RP/textures", author, project, type, texture.replace(".png", "_mers.tga")),
                    ),
                });
            }
        }
    }
}

let duplicates = [];
for (const blocks of DATA.blocks) {
    const check = DATA.items.filter((x) => x.name === blocks.name);
    if (check.length > 0) duplicates.push(...check);
}
for (const items of DATA.items) {
    const check = DATA.blocks.filter((x) => x.name === items.name);
    if (check.length > 0) duplicates.push(...check);
}

if (duplicates.length > 0) throw new Error(`Cannot have duplicate texture names\nDuplicate: ${duplicates[0].path}`);

const cfgName = JSON.parse(readFileSync(paths.root("config.json")).toString()).name;
import flipbook_textures from "./flipbook_textures.js";
import terrain_texture from "./terrain_texture.js";
import item_textures from "./item_textures.js";
import texture_set from "./texture_set.js";

item_textures(DATA, cfgName);
terrain_texture(DATA, cfgName);
flipbook_textures(DATA);
texture_set(DATA);
