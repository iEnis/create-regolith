#!/usr/bin/env node
import Wrapper from "./Wrapper.js";
import install, { checkEmpty, minVersion } from "./cmd.js";
console.clear();
process.on("SIGINT", () => {
    if (Wrapper.activeSpinner) Wrapper.spinnerError();
});

if (!checkEmpty()) Wrapper.notEmpty();

Wrapper.intro(`Create Regolith v${Wrapper.version}`);

const versionCheck = await minVersion();
if (!versionCheck) {
    Wrapper.outro("Please make sure you have regolith installed and are on at least 1.5.0");
    process.exit();
}

const author = await Wrapper.text({
    message: "What should the author name be?",
    hint: "This can always be changed in the 'package.json' and 'config.json' later",
    validate: (value) => (value.length === 0 ? "Author cannot be empty" : undefined),
    placeholder: "Author Name",
});

const name = await Wrapper.text({
    message: "What should the Project name be?",
    validate: (value) => (value.length === 0 ? "Name cannot be empty" : undefined),
    placeholder: "Project Name",
});

const description = await Wrapper.text({
    message: "What should the Add-On description be?",
    hint: "[Optional] Can be changed in the 'package.json' & 'config.json' later",
    placeholder: "Project Description",
});

const beta = await Wrapper.confirm({
    message: "Would you like to use stable or beta api's",
    active: "Beta",
    inactive: "Stable",
    initialValue: false,
});

let prealpha = false;

if (beta)
    prealpha = await Wrapper.confirm({
        message: "Would you like to the beta or alpha tagged version",
        active: "Alpha",
        inactive: "Beta",
        initialValue: false,
    });

const nodeModules: { [key: string]: { beta: boolean; hint?: string } } = {
    "@minecraft/server": { beta: false },
    "@minecraft/server-ui": { beta: false },
    "@minecraft/server-gametest": { beta: true },
    "@minecraft/server-net": { beta: true, hint: "This only works on Servers" },
    "@minecraft/server-admin": { beta: true, hint: "This only works on Realms and Servers" },
};

const modules = await Wrapper.multiselect({
    message: "What modules would you like to install",
    options: Object.keys(nodeModules)
        .filter((x) => (beta ? true : nodeModules[x].beta === false))
        .map((x) => {
            const value: { value: string; hint?: string } = { value: x };
            if (nodeModules[x]?.hint) value.hint = nodeModules[x].hint;
            return value;
        }),
    required: true,
});

const utilList: { value: string; label?: string; hint?: string }[] = [
    { value: "typescript", label: "Typescript" },
    { value: "esbuild", label: "esBuild" },
    { value: "gens", label: "Texture Generator" },
];

if (modules.includes("@minecraft/server-ui"))
    utilList.push({ value: "typesafe-mc", label: "Typesafe-MC", hint: "Recommended" });

const utils = await Wrapper.multiselect({
    message: "Select your utilities",
    options: utilList,
});

await install({ author, name, description, beta, modules, prealpha, utils });

Wrapper.outro("Finished setting up Regolith Project");

Wrapper.instructions(utils);
