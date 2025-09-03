import { exec } from "child_process";
import path from "path";

const $ = (cmd) =>
    new Promise((r) =>
        exec(cmd, { cwd: import.meta.dirname, shell: "cmd.exe", env: { ...process.env, NODE_PATH: "" } }, () => {}).on("close", r),
    );

await $(path.join(import.meta.dirname, "build.bat"));