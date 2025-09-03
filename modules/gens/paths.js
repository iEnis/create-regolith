import path from "path";
export default {
    regolith: (...paths) => path.join(import.meta.dirname, "../../.regolith/tmp", ...paths),
    packs: (...paths) => path.join(import.meta.dirname, "../../packs", ...paths),
    root: (...paths) => path.join(import.meta.dirname, "../..", ...paths),
};
