import {
    APIRole,
    ApplicationCommandAttachmentOption,
    ApplicationCommandAutocompleteNumericOptionData,
    ApplicationCommandAutocompleteStringOption,
    ApplicationCommandBooleanOptionData,
    ApplicationCommandChannelOptionData,
    ApplicationCommandMentionableOptionData,
    ApplicationCommandNumericOptionData,
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    ApplicationCommandRoleOptionData,
    ApplicationCommandStringOptionData,
    ApplicationCommandSubGroupData,
    ApplicationCommandType,
    ApplicationCommandUserOptionData,
    Attachment,
    AutocompleteInteraction,
    Awaitable,
    Channel,
    ChannelType,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    Client,
    ClientOptions,
    CommandInteraction,
    Events,
    InteractionType,
    Locale,
    LocalizationMap,
    Role,
    User,
} from "discord.js";
import { readFileSync, readdirSync } from "fs";

type Extend<T, U, K extends string, R extends boolean, V> = SlashUtil<{ [S in keyof T | K]: S extends keyof T ? T[S] : R extends true ? V : V | null }, U>;

class SlashUtil<T = { _: ChatInputCommandInteraction }, U = undefined> {
    private _name?: string;
    private _group?: string;
    private _sub?: string;
    private _description?: string;
    private autocompletes: Record<string, any> = {};
    private options: ApplicationCommandOptionData[] = [];
    private chain: any[] = [];
    private errorFn: any;

    constructor(private commandsUtil: CommandsUtil, private argentium: Argentium) {}

    public key(key: string) {
        const parts = key.split(/\s+/).filter((x) => x);
        if (parts.length < 1 || parts.length > 3) throw new Error("Slash command key must be 1-3 terms separated by whitespace");

        if (parts.length === 1) [this._name] = parts;
        else if (parts.length === 2) [this._name, this._sub] = parts;
        else if (parts.length === 3) [this._name, this._group, this._sub] = parts;

        return this;
    }

    public description(description: string) {
        this._description = description;
        return this;
    }

    public stringOption<K extends string, V extends Record<string, string>, R extends boolean = false>(
        name: K,
        description: string,
        options?: {
            maxLength?: number;
            minLength?: number;
            autocomplete?: (
                query: string,
                interaction: AutocompleteInteraction,
            ) => Awaitable<(string | [string, string] | { name: string; value: string })[] | Record<string, string> | undefined | null | void>;
            required?: R;
            choices?: V;
        },
    ) {
        const data: ApplicationCommandStringOptionData | ApplicationCommandAutocompleteStringOption = {
            type: ApplicationCommandOptionType.String,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            maxLength: options?.maxLength,
            minLength: options?.minLength,
            autocomplete: !!options?.autocomplete,
            required: options?.required,
        };

        if (options?.autocomplete) this.autocompletes[data.name] = options.autocomplete;

        if (options?.choices)
            if (data.autocomplete) throw new Error(`Autocomplete and choices cannot both be specified`);
            else
                data.choices = Object.entries(options.choices).map(([x, y]) => ({
                    value: x,
                    name: this.argentium.localizeDefault(y),
                    nameLocalizations: this.argentium.getLocalizations(y),
                }));

        this.options.push(data);

        return this as Extend<T, U, K, R, keyof V>;
    }

    public numberOption<K extends string, V extends Record<number, string>, R extends boolean = false>(
        name: K,
        description: string,
        options?: {
            float?: boolean;
            maximum?: number;
            minimum?: number;
            autocomplete?: (
                query: string,
                interaction: AutocompleteInteraction,
            ) => Awaitable<(number | [number, string] | { name: string; value: number })[] | Record<number, string> | undefined | null | void>;
            required?: R;
            choices?: V;
        },
    ) {
        const data: ApplicationCommandNumericOptionData | ApplicationCommandAutocompleteNumericOptionData = {
            type: options?.float ? ApplicationCommandOptionType.Number : ApplicationCommandOptionType.Integer,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            maxValue: options?.maximum,
            minValue: options?.minimum,
            autocomplete: !!options?.autocomplete,
            required: options?.required,
        };

        if (options?.autocomplete) this.autocompletes[data.name] = options.autocomplete;

        if (options?.choices)
            if (data.autocomplete) throw new Error(`Autocomplete and choices cannot both be specified`);
            else
                data.choices = Object.entries(options.choices).map(([x, y]) => ({
                    value: +x,
                    name: this.argentium.localizeDefault(y),
                    nameLocalizations: this.argentium.getLocalizations(y),
                }));

        this.options.push(data);

        return this as Extend<T, U, K, R, keyof V>;
    }

    public booleanOption<K extends string, R extends boolean = false>(name: K, description: string, options?: { required?: R }) {
        const data: ApplicationCommandBooleanOptionData = {
            type: ApplicationCommandOptionType.Boolean,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };

        this.options.push(data);

        return this as Extend<T, U, K, R, keyof boolean>;
    }

    public userOption<K extends string, R extends boolean = false>(name: K, description: string, options?: { required?: R }) {
        const data: ApplicationCommandUserOptionData = {
            type: ApplicationCommandOptionType.User,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };

        this.options.push(data);

        return this as Extend<T, U, K, R, User>;
    }

    public channelOption<K extends string, R extends boolean = false, C extends ChannelType | undefined = undefined>(
        name: K,
        description: string,
        options?: { required?: R; channelTypes: C[] },
    ) {
        const data: ApplicationCommandChannelOptionData = {
            type: ApplicationCommandOptionType.Channel,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };

        this.options.push(data);

        return this as Extend<T, U, K, R, C extends undefined ? Channel : Extract<Channel, { type: C }>>;
    }

    public roleOption<K extends string, R extends boolean = false>(name: K, description: string, options?: { required?: R }) {
        const data: ApplicationCommandRoleOptionData = {
            type: ApplicationCommandOptionType.Role,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };

        this.options.push(data);

        return this as Extend<T, U, K, R, Role | APIRole>;
    }

    public mentionableOption<K extends string, R extends boolean = false>(name: K, description: string, options?: { required?: R }) {
        const data: ApplicationCommandMentionableOptionData = {
            type: ApplicationCommandOptionType.Mentionable,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };

        this.options.push(data);

        return this as Extend<T, U, K, R, User | Role | APIRole>;
    }

    public fileOption<K extends string, R extends boolean = false>(name: K, description: string, options?: { required?: R }) {
        const data: ApplicationCommandAttachmentOption = {
            type: ApplicationCommandOptionType.Attachment,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };

        this.options.push(data);

        return this as Extend<T, U, K, R, Attachment>;
    }

    public fn<R>(fn: (t: U extends undefined ? T : U, og: T) => R) {
        this.chain.push(fn);

        return this as unknown as SlashUtil<
            T,
            R extends undefined | null | void | Promise<undefined | null | void> ? (U extends undefined ? T : U) : R extends Promise<infer M> ? M : R
        >;
    }

    public error(fn: (e: any, t: T) => any) {
        this.errorFn = fn;
        return this;
    }

    public apply(commandDataMap: Record<string, ChatInputApplicationCommandData>, srcMap: Record<string, SlashUtil<any, any>>) {
        if (!this._name) throw new Error(`Missing name in slash command`);
        if (!this._description) throw new Error(`Missing description in slash command`);

        const name = this.argentium.localizeDefault(this._name);
        const groupName = this._group && this.argentium.localizeDefault(this._group);
        const subName = this._sub && this.argentium.localizeDefault(this._sub);

        srcMap[[name, groupName, subName].filter((x) => x).join(" ")] = this;

        if (!subName) {
            if (name in commandDataMap) throw new Error(`Conflicting commands with name ${this._name}`);

            commandDataMap[name] = {
                name,
                nameLocalizations: this.argentium.getLocalizations(this._name),
                description: this.argentium.localizeDefault(this._description),
                descriptionLocalizations: this.argentium.getLocalizations(this._description),
                options: this.options,
            };
        } else if (groupName) {
            const root = (commandDataMap[name] ??= { name, nameLocalizations: this.argentium.getLocalizations(this._name), description: "-", options: [] });

            if (root.options?.some((x) => x.type !== ApplicationCommandOptionType.Subcommand && x.type !== ApplicationCommandOptionType.SubcommandGroup))
                throw new Error(`Conflicting commands with name ${this._name}`);

            if (root.options?.some((x) => x.type === ApplicationCommandOptionType.Subcommand && x.name === groupName))
                throw new Error(`Conflicting subcommand and subcommand group with name ${this._name} ${this._group}`);

            let group: ApplicationCommandSubGroupData | undefined = root.options?.find(
                (x) => x.type === ApplicationCommandOptionType.SubcommandGroup && x.name === groupName,
            ) as any;

            if (group?.options.some((x) => x.type === ApplicationCommandOptionType.Subcommand && x.name === subName))
                throw new Error(`Duplicate definition of /${this._name} ${this._group} ${this._sub}`);

            if (!group) {
                group = {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: groupName,
                    nameLocalizations: this.argentium.getLocalizations(this._group!),
                    description: "-",
                    options: [],
                };

                root.options = [...root.options!, group];
            }

            group.options = [
                ...group.options,
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: subName,
                    nameLocalizations: this.argentium.getLocalizations(this._sub!),
                    description: this.argentium.localizeDefault(this._description),
                    descriptionLocalizations: this.argentium.getLocalizations(this._description),
                    options: this.options as any,
                },
            ];
        } else {
            const root = (commandDataMap[name] ??= { name, nameLocalizations: this.argentium.getLocalizations(this._name), description: "-", options: [] });

            if (root.options?.some((x) => x.type !== ApplicationCommandOptionType.Subcommand && x.type !== ApplicationCommandOptionType.SubcommandGroup))
                throw new Error(`Conflicting commands with name ${this._name}`);

            if (root.options?.some((x) => x.type === ApplicationCommandOptionType.SubcommandGroup && x.name === subName))
                throw new Error(`Conflicting subcommand and subcommand group with name ${this._name} ${this._group}`);

            root.options = [
                ...(root.options ?? []),
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: subName,
                    nameLocalizations: this.argentium.getLocalizations(this._sub!),
                    description: this.argentium.localizeDefault(this._description),
                    descriptionLocalizations: this.argentium.getLocalizations(this._description),
                    options: this.options as any,
                },
            ];
        }

        return this;
    }

    public getData(cmd: ChatInputCommandInteraction) {
        let data: any = { _: cmd };

        for (const option of this.options)
            switch (option.type) {
                case ApplicationCommandOptionType.String:
                case ApplicationCommandOptionType.Integer:
                case ApplicationCommandOptionType.Boolean:
                case ApplicationCommandOptionType.Number:
                    data[option.name] = cmd.options.get(option.name)?.value ?? null;
                    break;
                case ApplicationCommandOptionType.User:
                    data[option.name] = cmd.options.getUser(option.name);
                    break;
                case ApplicationCommandOptionType.Channel:
                    data[option.name] = cmd.options.getChannel(option.name);
                    break;
                case ApplicationCommandOptionType.Role:
                    data[option.name] = cmd.options.getRole(option.name);
                    break;
                case ApplicationCommandOptionType.Mentionable:
                    data[option.name] = cmd.options.getMentionable(option.name);
                    break;
                case ApplicationCommandOptionType.Attachment:
                    data[option.name] = cmd.options.getAttachment(option.name);
                    break;
            }

        return data;
    }

    public async autocomplete(ai: AutocompleteInteraction) {
        const option = ai.options.getFocused(true);
        const data = await this.autocompletes[option.name](option.value, ai);

        if (!data) return;

        if (Array.isArray(data))
            return data
                .slice(0, 25)
                .map((x: any) =>
                    typeof x === "string" || typeof x === "number" ? { name: `${x}`, value: x } : Array.isArray(x) ? { name: x[1], value: x[0] } : x,
                );

        return Object.entries(data).map(([x, y]: any) => ({ name: y, value: x }));
    }

    public async exec(data: any): Promise<T> {
        const og = data;
        let realData: any = undefined;
        for (const fn of this.chain) data = (realData = await fn(data, og)) ?? data;
        return realData;
    }

    public async catch(e: any, cmd: ChatInputCommandInteraction) {
        if (!this.errorFn) throw e;
        await this.errorFn(e, this.getData(cmd));
    }
}

class CommandsUtil {
    private slashCommandDataMap: Record<string, ChatInputApplicationCommandData> = {};
    private slashCommandSrcMap: Record<string, SlashUtil<any, any>> = {};
    private prefix: any[] = [];
    private suffix: any[] = [];

    constructor(private argentium: Argentium) {}

    public slash(fn: (util: SlashUtil) => SlashUtil<any, any>) {
        const su = fn(new SlashUtil(this, this.argentium));
        su.apply(this.slashCommandDataMap, this.slashCommandSrcMap);

        return this;
    }

    public beforeAll(fn: (t: { _: CommandInteraction } & Omit<any, "_">, escape: (t: any) => void) => any) {
        this.prefix.push(fn);
        return this;
    }

    public afterAll(fn: (t: { _: CommandInteraction } & Omit<any, "_">) => any) {
        this.suffix.push(fn);
        return this;
    }

    public async apply(client: Client) {
        await client.application!.commands.set(Object.values(this.slashCommandDataMap));

        client.on(Events.InteractionCreate, async (i) => {
            if (i.type === InteractionType.ApplicationCommand) {
                const fmt = (k: any) => (typeof k === "string" ? { content: k } : k);
                const reply = (k: any) => (i.deferred ? i.editReply(fmt(k)) : i.replied ? i.followUp(fmt(k)) : i.reply(fmt(k)));

                if (i.commandType === ApplicationCommandType.ChatInput) {
                    const key = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)].filter((x) => x).join(" ");
                    const slash = this.slashCommandSrcMap[key];

                    if (slash) {
                        try {
                            const data = slash.getData(i);
                            let response: any;

                            for (const fn of this.prefix) {
                                await fn(data, (x: any) => (response = x));
                                if (response) break;
                            }

                            response ??= await slash.exec(data);

                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }

                            if (response != undefined) await reply(response);
                        } catch (e) {
                            const response = await slash.catch(e, i);
                            if (response != undefined) await reply(response);
                        }
                    }
                }
            } else if (i.type === InteractionType.ApplicationCommandAutocomplete) {
                try {
                    const key = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)].filter((x) => x).join(" ");
                    const slash = this.slashCommandSrcMap[key];

                    const response = await slash.autocomplete(i);
                    if (response) await i.respond(response);
                } catch {}
            }
        });
    }
}

export default class Argentium {
    private doLocalize = false;
    private defaultLocale: Locale = Locale.EnglishUS;
    private localizations: Partial<Record<Locale, Record<string, string>>> = {};
    private commandsUtil = new CommandsUtil(this);
    private onReady: any[] = [];

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

    public commands(fn: (commandsUtil: CommandsUtil) => any) {
        fn(this.commandsUtil);
        return this;
    }

    public ready(fn: () => any) {
        this.onReady.push(fn);
        return this;
    }

    public async apply(client: Client) {
        await this.commandsUtil.apply(client);
    }

    public async client(token: string, options: ClientOptions) {
        const client = new Client(options);
        await client.login(token);

        for (const fn of this.onReady) client.on(Events.ClientReady, fn);
        await new Promise((r) => client.on(Events.ClientReady, r));

        await this.apply(client);

        return client;
    }
}
