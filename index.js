import { Client, Events, Locale, } from "discord.js";
import { readFileSync, readdirSync } from "fs";
import { CommandsUtil } from "./src/commands-util";
export default class Argentium {
    doLocalize = false;
    defaultLocale = Locale.EnglishUS;
    localizations = {};
    commandsUtils = [];
    listeners = [];
    dmCommands = [];
    commandPrefix = [];
    commandErrorFn;
    use(fn) {
        return fn(this);
    }
    setDefaultLocale(locale) {
        this.doLocalize = true;
        this.defaultLocale = locale;
        return this;
    }
    insertLocalizations(locale, data) {
        this.doLocalize = true;
        const map = (this.localizations[locale] ??= {});
        for (let line of data.trim().split(/\n+/)) {
            line = line.trim();
            if (line.length === 0)
                continue;
            const match = line.match(/^(.+?)\s*=\s*(.+)$/);
            if (!match)
                throw new Error(`Expected localization lines to be of the format "key = value" but found the following:\n    ${line}`);
            if (match[1] in map)
                throw new Error(`Duplicate localization key ${match[1]} for ${locale}`);
            map[match[1]] = match[2];
        }
        return this;
    }
    addLocalizations(locales, directory) {
        this.doLocalize = true;
        const names = readdirSync(directory);
        const map = {};
        const required = new Set(locales.map((x) => x.toLowerCase()));
        for (const name of names) {
            const parts = name.split(".");
            let ext = parts.at(-1);
            if (ext === "txt")
                ext = parts.at(-2);
            ext ??= "";
            if (!required.has(ext))
                continue;
            if (ext in map)
                throw new Error(`Ambiguous localization: two files with extension .${ext} were found in ${directory}`);
            map[ext] = name;
        }
        const missing = [...required].filter((x) => !(x in map));
        if (missing.length > 0)
            throw new Error(`Missing localization(s) in ${directory}: ${missing.join(", ")}`);
        for (const locale of locales)
            this.addLocalizationsFile(locale, `${directory}/${map[locale.toLowerCase()]}`);
        return this;
    }
    addLocalizationsFile(locale, path) {
        this.insertLocalizations(locale, readFileSync(path, "utf-8"));
        return this;
    }
    localize(locale, key, options) {
        if (!this.doLocalize)
            return key;
        if (options?.error !== false && !(key in (this.localizations[locale] ?? {})))
            throw new Error(`Could not localize ${key} for ${locale}`);
        return ((this.localizations[locale] ?? (options?.defaultLocale && this.localizations[options.defaultLocale]))?.[key] ??
            (options?.passThrough ? key : options?.default ?? null));
    }
    localizeDefault(key, options) {
        if (!this.doLocalize)
            return key;
        return this.localize(this.defaultLocale, key, options);
    }
    getLocalizations(key) {
        if (!this.doLocalize)
            return {};
        return Object.fromEntries(Object.entries(this.localizations)
            .filter(([, map]) => key in map)
            .map(([locale, map]) => [locale, map[key]]));
    }
    beforeAllCommands(fn) {
        this.commandPrefix.push(fn);
        return this;
    }
    commands(fn) {
        const util = new CommandsUtil(this);
        this.commandsUtils.push(util);
        fn(util);
        return this;
    }
    onCommandError(fn) {
        this.commandErrorFn = fn;
        return this;
    }
    allowInDms(...names) {
        this.dmCommands.push(...names.map((name) => this.localizeDefault(name)));
        return this;
    }
    on(e, fn) {
        this.listeners.push([e, fn]);
        return this;
    }
    async preApply(client) {
        this.listeners.forEach(([e, fn]) => client.on(e, fn));
    }
    async postApply(client) {
        await client.application.commands.set(this.commandsUtils.flatMap((x) => x.commandArray.map((x) => ({ ...x, dmPermission: this.dmCommands.includes(x.name) }))));
        for (const util of this.commandsUtils)
            await util.apply(client);
    }
    async client(token, options) {
        const client = new Client(options);
        await client.login(token);
        await this.preApply(client);
        await new Promise((r) => client.on(Events.ClientReady, r));
        await this.postApply(client);
        return client;
    }
}
