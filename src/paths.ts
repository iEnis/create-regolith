import path from "path";

export default {
    exec: (...paths: string[]) => path.join(process.cwd(), ...paths),
    node: (...paths: string[]) => path.join(import.meta.dirname, ...paths),
};
