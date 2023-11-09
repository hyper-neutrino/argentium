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
    ApplicationCommandUserOptionData,
    Attachment,
    AutocompleteInteraction,
    Awaitable,
    Channel,
    ChannelType,
    ChatInputApplicationCommandData,
    ChatInputCommandInteraction,
    Role,
    User,
} from "discord.js";
import Argentium from "../index.ts";
import { Extend } from "./type-utils.ts";

export class SlashUtil<T = { _: ChatInputCommandInteraction }, U = undefined> {
    private _name?: string;
    private _group?: string;
    private _sub?: string;
    private _description?: string;
    private autocompletes: Record<string, any> = {};
    private options: ApplicationCommandOptionData[] = [];
    private chain: any[] = [];
    private errorFn: any;

    constructor(private argentium: Argentium) {}

    public use<R1, R2>(fn: (util: SlashUtil<T, U>) => SlashUtil<R1, R2>) {
        return fn(this);
    }

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

        return this as Extend<T, U, K, R, boolean>;
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
            channelTypes: (options?.channelTypes ?? []).filter((x) => x !== undefined) as any,
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

    public get willCatch() {
        return !!this.errorFn;
    }

    public async catch(e: any, cmd: ChatInputCommandInteraction) {
        if (!this.errorFn) throw e;
        await this.errorFn(e, this.getData(cmd));
    }
}
