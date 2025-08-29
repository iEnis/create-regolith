import spinner, { type Spinner } from "yocto-spinner";
import type { ConfirmOptions, TextOptions, MultiSelectOptions } from "./uiTypes.js";
import { color, colorString, colorSymbol, displayUI } from "./UI.js";
import { TextPrompt, ConfirmPrompt, isCancel, MultiSelectPrompt } from "@clack/core";
import pc from "picocolors";

export default class Wrapper {
    protected constructor() {}
    public static activeSpinner?: { spinner: Spinner; message: string };

    private static cancel(value: any) {
        if (isCancel(value) || typeof value === "symbol") return true;
        else return false;
    }

    private static exit(message = "Canceled!") {
        console.log(`${colorSymbol("bottomBar", "dim")}  ${color(["bgRed", "white"], ` ${message} `)}`);
        process.exit(1);
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
        const value = await p.prompt();
        if (this.cancel(value)) this.exit();
        return value as string;
    }

    public static instructions() {
        console.log(
            [
                "",
                `${colorSymbol("topBar", "dim")}`,
                `${colorSymbol("bar", "dim")}  ${color("red", "You need Regolith for this to work!")}`,
                `${colorSymbol("bar", "dim")}  ${color("fg", "Run 'npm i' before going further")}`,
                `${colorSymbol("bar", "dim")}`,
                `${colorSymbol("bar", "dim")}  ${color("fg", "Commands:")}`,
                `${colorSymbol("bar", "dim")}  ${color("fg", "'regolith run/watch' will bundle the project")}`,
                `${colorSymbol("bar", "dim")}  ${color("fg", "'regolith run/watch build' will build the project")}`,
                `${colorSymbol("bar", "dim")}  ${color("fg", "'regolith run/watch bundle' will bundle the project")}`,
                `${colorSymbol("bottomBar", "dim")}`,
                "",
            ].join("\n"),
        );
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
