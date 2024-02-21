import { AutocompleteInteraction, ChatInputCommandInteraction, Client, ClientEvents, ClientOptions, CommandInteraction, Locale, LocalizationMap, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from "discord.js";
import { CommandsUtil } from "./src/commands-util";
export default class Argentium {
    private doLocalize;
    private defaultLocale;
    private localizations;
    private commandsUtils;
    private listeners;
    private dmCommands;
    commandPrefix: any[];
    commandErrorFn?: any;
    use(fn: (argentium: Argentium) => Argentium): Argentium;
    setDefaultLocale(locale: Locale): this;
    private insertLocalizations;
    addLocalizations(locales: Locale[], directory: string): this;
    addLocalizationsFile(locale: Locale, path: string): this;
    localize<T extends boolean = true>(locale: Locale, key: string, options?: {
        defaultLocale?: Locale;
        passThrough?: boolean;
        error?: T;
        default?: string;
    }): T extends true ? string : string | null;
    localizeDefault<T extends boolean = true>(key: string, options?: {
        passThrough?: boolean;
        error?: T;
        default?: string;
    }): T extends true ? string : string | null;
    getLocalizations(key: string): LocalizationMap;
    beforeAllCommands(fn: (t: {
        _: CommandInteraction | AutocompleteInteraction;
    } & Omit<any, "_">, escape: (t: any) => void) => any): this;
    commands(fn: (commandsUtil: CommandsUtil) => any): this;
    onCommandError(fn: (e: any, _: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction) => any): this;
    allowInDms(...names: string[]): this;
    on<K extends keyof ClientEvents>(e: K, fn: (...args: ClientEvents[K]) => any): this;
    preApply(client: Client): Promise<void>;
    postApply(client: Client): Promise<void>;
    client(token: string, options: ClientOptions): Promise<Client<boolean>>;
}
