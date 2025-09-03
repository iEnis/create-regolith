import { writeFileSync } from "fs";
import paths from "./paths.js";

/**
 * @param {import("./types").Storage} storage
 * @param {string} name
 */
export default function terrain_texture(storage, name) {
    const json = {
        resource_pack_name: name,
        texture_name: "atlas.terrain",
        padding: 8,
        num_mip_levels: 4,
        texture_data: {},
    };

    for (const data of storage.blocks) {
        json.texture_data[data.name] = { textures: data.path.replace(".png", "") };
    }

    writeFileSync(paths.regolith("RP/textures/terrain_texture.json"), JSON.stringify(json));
}
