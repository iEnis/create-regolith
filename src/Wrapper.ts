import { TextPrompt, ConfirmPrompt, isCancel, MultiSelectPrompt } from "@clack/core";
import type { ConfirmOptions, TextOptions, MultiSelectOptions } from "./uiTypes.js";
import { color, colorString, colorSymbol, displayUI } from "./UI.js";
import spinner, { type Spinner } from "yocto-spinner";
import { readFileSync } from "fs";
import paths from "./paths.js";

export default class Wrapper {
    protected constructor() {}
    public static activeSpinner?: { spinner: Spinner; message: string };
    public static version = JSON.parse(readFileSync(paths.node("package.json")).toString()).version;

    public static notEmpty() {
        console.log(
            [
                colorSymbol("topBar", "dim"),
                `${colorSymbol("cancel", "red")}  ${color("red", "The directory you're in is not empty")}`,
                colorSymbol("bottomBar", "dim"),
            ].join("\n"),
        );
        process.exit();
    }

    public static info() {
        console.log(
            [
                colorSymbol("bar", "dim"),
                `${colorSymbol("error", "yellow")}  ${color("fg", "This project requires unreleased features")}`,
                `${colorSymbol("bar", "dim")}  ${color("dim", "https://github.com/Bedrock-OSS/regolith/pull/331")}`,
            ].join("\n"),
        );
    }

    private static cancel(value: any) {
        if (isCancel(value) || typeof value === "symbol") return true;
        else return false;
    }

    private static exit(message = "Canceled!") {
        console.log(`${colorSymbol("bottomBar", "dim")}  ${color(["bgRed", "white"], ` ${message} `)}`);
        process.exit();
    }

    public static intro = (text: string) => console.log(`${colorSymbol("topBar", "dim")}  ${color("bg", ` ${text} `)}`);
    public static outro = (text: string) =>
        console.log(`${colorSymbol("bar", "dim")}\n${colorSymbol("bottomBar", "dim")}  ${color("bg", ` ${text} `)}`);

    public static async text(options: TextOptions) {
        const p = new TextPrompt({
            render() {
                return displayUI(
                    this.state,
                    options.message,
                    options.hint ?? "",
                    [
                        (this.value?.length ?? 0) < 1
                            ? color("dim", options.placeholder)
                            : `${this.value}${color(["bgWhite", "white"], ".")}`,
                    ],
                    this.value,
                    this.error,
                );
            },
            validate: (value) => (!!options.validate ? options.validate(value) : undefined),
        });
        const value = (await p.prompt()) ?? "";
        if (this.cancel(value)) this.exit();
        return value as string;
    }

    public static instructions(utils: string[]) {
        const msg: string[] = [];
        const add = (value: string) => msg.push(value);
        add("");
        add(`${colorSymbol("topBar", "dim")}`);
        // add(`${colorSymbol("bar", "dim")}  ${color("red", "You need Regolith for this to work!")}`);
        add(`${colorSymbol("bar", "dim")}  ${color("red", "Use the given Regolith executable for this to work!")}`);
        add(`${colorSymbol("bar", "dim")}`);
        add(`${colorSymbol("bar", "dim")}  ${color("fg", "Commands:")}`);
        add(`${colorSymbol("bar", "dim")}  ${color("fg", `'"./regolith.exe" run/watch' will bundle the project`)}`);
        if (utils.includes("esbuild")) {
            add(`${colorSymbol("bar", "dim")}  ${color("fg", `'"./regolith.exe" run/watch build' will build the project`)}`);
            add(
                `${colorSymbol("bar", "dim")}  ${color(
                    "fg",
                    `'"./regolith.exe" run/watch bundle' will bundle the project`,
                )}`,
            );
        }
        add(`${colorSymbol("bottomBar", "dim")}`);
        add("");
        console.log(msg.join("\n"));
    }

    public static async multiselect(options: MultiSelectOptions<string>) {
        const p = new MultiSelectPrompt({
            render() {
                if (this.value === undefined) this.value = [];
                return displayUI(
                    this.state,
                    options.message,
                    options.hint ?? "",
                    options.options.map((x, i) => {
                        const check = this.value.includes(x.value);
                        const selected = i === this.cursor;
                        return `${colorSymbol(
                            check ? "multiselectSelected" : "multiselectUnselected",
                            check ? "green" : selected ? "white" : "dim",
                        )} ${color(selected ? "white" : "dim", x.label ?? x.value)}${
                            !!x.hint ? ` ${color("dim", `(${x.hint})`)}` : ""
                        }`;
                    }),
                    this.value.join(", "),
                    this.error,
                );
            },
            options: options.options.map((x) => ({ value: x.value })),
            validate: (value) => {
                if (!!options.minItems && options.minItems > value.length)
                    return `You need to at least select ${options.minItems} items`;
                else if (!!options.maxItems && options.maxItems < value.length)
                    return `You need to at most select ${options.maxItems} items`;
                else if (options.required && value.length < 1) return `This field is required`;
                else if (!!options.validate) return options.validate(value);
            },
        });
        const value = await p.prompt();
        if (this.cancel(value)) this.exit();
        return value as unknown as string[];
    }

    public static async spinner(message: string, callback: () => Promise<boolean | string | undefined>) {
        console.log(colorSymbol("bar", "dim"));
        this.activeSpinner = { spinner: spinner({ color: colorString, text: color("fg", `  ${message}`) }), message };
        this.activeSpinner?.spinner.start();
        let value: boolean | string | undefined = undefined;
        const stop = (success: boolean) =>
            `${colorSymbol(success ? "done" : "error", success ? "green" : "red")}  ${color("fg", message)}${
                (success && typeof value === "string") || !success
                    ? `\n${colorSymbol("bar", "dim")}  ${color("dim", `${value}`)}`
                    : ""
            }`;
        try {
            value = await callback();
            if (value === undefined) throw new Error();
            this.activeSpinner?.spinner.stop(stop(true));
        } catch (e) {
            this.activeSpinner?.spinner.stop(stop(false));
            this.exit();
        }
        this.activeSpinner = undefined;
        return value;
    }

    public static spinnerError() {
        if (!this.activeSpinner) return this.exit();
        this.activeSpinner.spinner.stop();
        console.log(`${colorSymbol("cancel", "red")}  ${color("fg", this.activeSpinner?.message)}`);
        console.log(colorSymbol("bar", "dim"));
        this.exit();
    }

    public static async confirm(options: ConfirmOptions) {
        const active = color("dim", options.active ?? "Yes");
        const inactive = color("dim", options.inactive ?? "No");
        const p = new ConfirmPrompt({
            render() {
                const yes =
                    this.cursor === 0 ? colorSymbol("confirmSelected", "green") : colorSymbol("confirmUnselected", "dim");
                const no =
                    this.cursor === 1 ? colorSymbol("confirmSelected", "green") : colorSymbol("confirmUnselected", "dim");

                return displayUI(
                    this.state,
                    options.message,
                    options.hint ?? "",
                    [`${yes} ${active} ${color("reset", "|")} ${no} ${inactive}`],
                    this.cursor === 0 ? active : inactive,
                );
            },
            initialValue: options.initialValue,
            active,
            inactive,
        });
        const value = (await p.prompt()) as unknown as boolean | symbol;
        if (this.cancel(value)) this.exit();
        return value as boolean;
    }
}
