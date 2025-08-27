#!/usr/bin/env node
import Wrapper, { $ } from "./Wrapper.js";

process.on("SIGINT", () => {
    if (Wrapper.activeSpinner) Wrapper.spinnerError();
});

Wrapper.intro("Create Regolith");

const name = await Wrapper.text({
    message: "What should the Project name be?",
    validate: (value) => (value.length === 0 ? "Name cannot be empty" : undefined),
    placeholder: "Project Name",
});

const beta = await Wrapper.confirm({
    message: "Would you like to use stable or beta api's",
    active: "Beta",
    inactive: "Stable",
    initialValue: false,
});

const utils = await Wrapper.multiselect({
    message: "Select your utilities",
    options: [
        { value: "typesafe-mc", label: "Typesafe-MC", hint: "Recommended" },
        { value: "typescript", label: "Typescript" },
        { value: "esbuild", label: "esBuild" },
    ],
});

await Wrapper.spinner("Timer set for 3s", async () => {
    await new Promise((r) => setTimeout(r, 3000));
    return true;
});

Wrapper.outro("Finished setting up Regolith Project");
