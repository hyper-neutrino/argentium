import { Client, ClientEvents, ClientOptions, CommandInteraction, Events, Locale, LocalizationMap } from "discord.js";
import { readFileSync, readdirSync } from "fs";
import { CommandsUtil } from "./src/commands-util.ts";

export default class Argentium {
    private doLocalize = false;
    private defaultLocale: Locale = Locale.EnglishUS;
    private localizations: Partial<Record<Locale, Record<string, string>>> = {};
    private commandsUtils: CommandsUtil[] = [];
    private listeners: [keyof ClientEvents, any][] = [];
    private dmCommands: string[] = [];
    public commandPrefix: any[] = [];
    public commandErrorFn?: any;

    public use(fn: (argentium: Argentium) => Argentium) {
        return fn(this);
    }

    public setDefaultLocale(locale: Locale) {
        this.doLocalize = true;
        this.defaultLocale = locale;
        return this;
    }

    private insertLocalizations(locale: Locale, data: string) {
        this.doLocalize = true;
        const map = (this.localizations[locale] ??= {});

        for (let line of data.trim().split(/\n+/)) {
            line = line.trim();
            if (line.length === 0) continue;

            const match = line.match(/^(.+?)\s*=\s*(.+)$/);
            if (!match) throw new Error(`Expected localization lines to be of the format "key = value" but found the following:\n    ${line}`);

            if (match[1] in map) throw new Error(`Duplicate localization key ${match[1]} for ${locale}`);
            map[match[1]] = match[2];
        }

        return this;
    }

    public addLocalizations(locales: Locale[], directory: string) {
        this.doLocalize = true;
        const names = readdirSync(directory);
        const map: Record<string, string> = {};

        const required = new Set(locales.map((x) => x.toLowerCase()));

        for (const name of names) {
            const parts = name.split(".");

            let ext = parts.at(-1);
            if (ext === "txt") ext = parts.at(-2);
            ext ??= "";

            if (!required.has(ext)) continue;
            if (ext in map) throw new Error(`Ambiguous localization: two files with extension .${ext} were found in ${directory}`);

            map[ext] = name;
        }

        const missing = [...required].filter((x) => !(x in map));
        if (missing.length > 0) throw new Error(`Missing localization(s) in ${directory}: ${missing.join(", ")}`);

        for (const locale of locales) this.addLocalizationsFile(locale, `${directory}/${map[locale.toLowerCase()]}`);

        return this;
    }

    public addLocalizationsFile(locale: Locale, path: string) {
        this.insertLocalizations(locale, readFileSync(path, "utf-8"));
        return this;
    }

    public localize<T extends boolean = true>(
        locale: Locale,
        key: string,
        options?: { defaultLocale?: Locale; passThrough?: boolean; error?: T; default?: string },
    ): T extends true ? string : string | null {
        if (!this.doLocalize) return key;

        if (options?.error !== false && !(key in (this.localizations[locale] ?? {}))) throw new Error(`Could not localize ${key} for ${locale}`);

        return ((this.localizations[locale] ?? (options?.defaultLocale && this.localizations[options.defaultLocale]))?.[key] ??
            (options?.passThrough ? key : options?.default ?? null)) as any;
    }

    public localizeDefault<T extends boolean = true>(
        key: string,
        options?: { passThrough?: boolean; error?: T; default?: string },
    ): T extends true ? string : string | null {
        if (!this.doLocalize) return key;
        return this.localize(this.defaultLocale, key, options);
    }

    public getLocalizations(key: string): LocalizationMap {
        if (!this.doLocalize) return {};
        return Object.fromEntries(
            Object.entries(this.localizations)
                .filter(([, map]) => key in map)
                .map(([locale, map]) => [locale, map[key]]),
        );
    }

    public beforeAllCommands(fn: (t: { _: CommandInteraction } & Omit<any, "_">, escape: (t: any) => void) => any) {
        this.commandPrefix.push(fn);
        return this;
    }

    public commands(fn: (commandsUtil: CommandsUtil) => any) {
        const util = new CommandsUtil(this);
        this.commandsUtils.push(util);
        fn(util);
        return this;
    }

    public onCommandError(fn: (e: any, t: { _: CommandInteraction & Omit<any, "_"> }) => any) {
        this.commandErrorFn = fn;
        return this;
    }

    public allowInDms(...names: string[]) {
        this.dmCommands.push(...names.map((name) => this.localizeDefault(name)));
    }

    public on<K extends keyof ClientEvents>(e: K, fn: (...args: ClientEvents[K]) => any) {
        this.listeners.push([e, fn]);
        return this;
    }

    public async preApply(client: Client) {
        this.listeners.forEach(([e, fn]) => client.on(e, fn));
    }

    public async postApply(client: Client) {
        await client.application!.commands.set(
            this.commandsUtils.flatMap((x) => x.commandArray.map((x) => ({ ...x, dmPermission: this.dmCommands.includes(x.name) }))),
        );

        for (const util of this.commandsUtils) await util.apply(client);
    }

    public async client(token: string, options: ClientOptions) {
        const client = new Client(options);
        await client.login(token);

        await this.preApply(client);
        await new Promise((r) => client.on(Events.ClientReady, r));
        await this.postApply(client);

        return client;
    }
}
