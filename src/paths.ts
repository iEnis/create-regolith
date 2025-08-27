import path from "path";
path.join();
export default {
    exec: (...paths: string[]) => path.join(process.cwd(), ...paths),
    npm: (...paths: string[]) => path.join(import.meta.dirname, ...paths),
};
