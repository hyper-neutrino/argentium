import { ApplicationCommandOptionType, } from "discord.js";
export class SlashUtil {
    argentium;
    _name;
    _group;
    _sub;
    _description;
    autocompletes = {};
    options = [];
    chain = [];
    errorFn;
    constructor(argentium) {
        this.argentium = argentium;
    }
    use(fn) {
        return fn(this);
    }
    key(key) {
        const parts = key.split(/\s+/).filter((x) => x);
        if (parts.length < 1 || parts.length > 3)
            throw new Error("Slash command key must be 1-3 terms separated by whitespace");
        if (parts.length === 1)
            [this._name] = parts;
        else if (parts.length === 2)
            [this._name, this._sub] = parts;
        else if (parts.length === 3)
            [this._name, this._group, this._sub] = parts;
        return this;
    }
    description(description) {
        this._description = description;
        return this;
    }
    stringOption(name, description, options) {
        const data = {
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
        if (options?.autocomplete)
            this.autocompletes[data.name] = options.autocomplete;
        if (options?.choices)
            if (data.autocomplete)
                throw new Error(`Autocomplete and choices cannot both be specified`);
            else
                data.choices = Object.entries(options.choices).map(([x, y]) => ({
                    value: x,
                    name: this.argentium.localizeDefault(y),
                    nameLocalizations: this.argentium.getLocalizations(y),
                }));
        this.options.push(data);
        return this;
    }
    numberOption(name, description, options) {
        const data = {
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
        if (options?.autocomplete)
            this.autocompletes[data.name] = options.autocomplete;
        if (options?.choices)
            if (data.autocomplete)
                throw new Error(`Autocomplete and choices cannot both be specified`);
            else
                data.choices = Object.entries(options.choices).map(([x, y]) => ({
                    value: +x,
                    name: this.argentium.localizeDefault(y),
                    nameLocalizations: this.argentium.getLocalizations(y),
                }));
        this.options.push(data);
        return this;
    }
    booleanOption(name, description, options) {
        const data = {
            type: ApplicationCommandOptionType.Boolean,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };
        this.options.push(data);
        return this;
    }
    userOption(name, description, options) {
        const data = {
            type: ApplicationCommandOptionType.User,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };
        this.options.push(data);
        return this;
    }
    channelOption(name, description, options) {
        const data = {
            type: ApplicationCommandOptionType.Channel,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
            channelTypes: (options?.channelTypes ?? []).filter((x) => x !== undefined),
        };
        this.options.push(data);
        return this;
    }
    roleOption(name, description, options) {
        const data = {
            type: ApplicationCommandOptionType.Role,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };
        this.options.push(data);
        return this;
    }
    mentionableOption(name, description, options) {
        const data = {
            type: ApplicationCommandOptionType.Mentionable,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };
        this.options.push(data);
        return this;
    }
    fileOption(name, description, options) {
        const data = {
            type: ApplicationCommandOptionType.Attachment,
            name: this.argentium.localizeDefault(name),
            nameLocalizations: this.argentium.getLocalizations(name),
            description: this.argentium.localizeDefault(description),
            descriptionLocalizations: this.argentium.getLocalizations(description),
            required: options?.required,
        };
        this.options.push(data);
        return this;
    }
    fn(fn) {
        this.chain.push(fn);
        return this;
    }
    error(fn) {
        this.errorFn = fn;
        return this;
    }
    apply(commandDataMap, srcMap) {
        if (!this._name)
            throw new Error(`Missing name in slash command`);
        if (!this._description)
            throw new Error(`Missing description in slash command`);
        const name = this.argentium.localizeDefault(this._name);
        const groupName = this._group && this.argentium.localizeDefault(this._group);
        const subName = this._sub && this.argentium.localizeDefault(this._sub);
        srcMap[[name, groupName, subName].filter((x) => x).join(" ")] = this;
        if (!subName) {
            if (name in commandDataMap)
                throw new Error(`Conflicting commands with name ${this._name}`);
            commandDataMap[name] = {
                name,
                nameLocalizations: this.argentium.getLocalizations(this._name),
                description: this.argentium.localizeDefault(this._description),
                descriptionLocalizations: this.argentium.getLocalizations(this._description),
                options: this.options,
            };
        }
        else if (groupName) {
            const root = (commandDataMap[name] ??= { name, nameLocalizations: this.argentium.getLocalizations(this._name), description: "-", options: [] });
            if (root.options?.some((x) => x.type !== ApplicationCommandOptionType.Subcommand && x.type !== ApplicationCommandOptionType.SubcommandGroup))
                throw new Error(`Conflicting commands with name ${this._name}`);
            if (root.options?.some((x) => x.type === ApplicationCommandOptionType.Subcommand && x.name === groupName))
                throw new Error(`Conflicting subcommand and subcommand group with name ${this._name} ${this._group}`);
            let group = root.options?.find((x) => x.type === ApplicationCommandOptionType.SubcommandGroup && x.name === groupName);
            if (group?.options.some((x) => x.type === ApplicationCommandOptionType.Subcommand && x.name === subName))
                throw new Error(`Duplicate definition of /${this._name} ${this._group} ${this._sub}`);
            if (!group) {
                group = {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: groupName,
                    nameLocalizations: this.argentium.getLocalizations(this._group),
                    description: "-",
                    options: [],
                };
                root.options = [...root.options, group];
            }
            group.options = [
                ...group.options,
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: subName,
                    nameLocalizations: this.argentium.getLocalizations(this._sub),
                    description: this.argentium.localizeDefault(this._description),
                    descriptionLocalizations: this.argentium.getLocalizations(this._description),
                    options: this.options,
                },
            ];
        }
        else {
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
                    nameLocalizations: this.argentium.getLocalizations(this._sub),
                    description: this.argentium.localizeDefault(this._description),
                    descriptionLocalizations: this.argentium.getLocalizations(this._description),
                    options: this.options,
                },
            ];
        }
        return this;
    }
    getData(cmd) {
        let data = { _: cmd };
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
    async autocomplete(ai) {
        const option = ai.options.getFocused(true);
        const data = await this.autocompletes[option.name](option.value, ai);
        if (!data)
            return;
        if (Array.isArray(data))
            return data
                .slice(0, 25)
                .map((x) => typeof x === "string" || typeof x === "number" ? { name: `${x}`, value: x } : Array.isArray(x) ? { name: x[1], value: x[0] } : x);
        return Object.entries(data).map(([x, y]) => ({ name: y, value: x }));
    }
    async exec(data) {
        const og = data;
        let realData = undefined;
        for (const fn of this.chain)
            data = (realData = await fn(data, og)) ?? data;
        return realData;
    }
    get willCatch() {
        return !!this.errorFn;
    }
    async catch(e, cmd) {
        if (!this.errorFn)
            throw e;
        await this.errorFn(e, this.getData(cmd));
    }
}
