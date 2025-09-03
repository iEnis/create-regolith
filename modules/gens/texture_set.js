import { writeFileSync } from "fs";
import paths from "./paths.js";

/**
 * @param {import("./types").Storage} storage
 */
export default function texture_set(storage) {
    for (const [_, dataList] of Object.entries(storage)) {
        for (const data of dataList) {
            if (!data.tga) continue;
            writeFileSync(
                paths.regolith("RP", data.path.replace(".png", ".texture_set.json")),
                JSON.stringify({
                    format_version: "1.21.30",
                    "minecraft:texture_set": {
                        color: data.name,
                        metalness_emissive_roughness_subsurface: data.name + "_mers",
                    },
                }),
            );
        }
    }
}
