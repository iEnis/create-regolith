import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import paths from "./paths.js";

/**
 * @param {import("./types").Storage} storage
 * @param {string} name
 */
export default function flipbook_textures(storage, name) {
    /** @type {import("./types").flipbook[]} */
    const json = [];

    for (const [_, dataList] of Object.entries(storage)) {
        for (const data of dataList) {
            if (!data.anim) continue;

            /** @type {import("./types").flipbook} */
            const options = {
                flipbook_texture: data.path.replace(".png", ""),
                atlas_tile: data.name,
            };
            const path = paths.regolith("RP", data.path.replace(".png", ".json"));
            if (existsSync(path)) {
                for (const [key, value] of Object.entries(JSON.parse(readFileSync(path).toString()))) {
                    options[key] = value;
                }
                rmSync(path);
            }

            json.push(options);
        }
    }

    writeFileSync(paths.regolith("RP/textures/flipbook_textures.json"), JSON.stringify(json));
}
