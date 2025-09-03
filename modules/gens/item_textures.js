import { writeFileSync } from "fs";
import paths from "./paths.js";

/**
 * @param {import("./types").Storage} storage
 * @param {string} name
 */
export default function item_textures(storage, name) {
    const json = {
        resource_pack_name: name,
        texture_name: "atlas.items",
        texture_data: {},
    };

    for (const data of storage.items) {
        json.texture_data[data.name] = { textures: data.path.replace(".png", "") };
    }

    writeFileSync(paths.regolith("RP/textures/item_textures.json"), JSON.stringify(json));
}
