import { AutocompleteInteraction, ChatInputApplicationCommandData, Client, CommandInteraction, MessageApplicationCommandData, UserApplicationCommandData } from "discord.js";
import Argentium from "..";
import { MessageCtxUtil } from "./message-ctx-util";
import { SlashUtil } from "./slash-util";
import { UserCtxUtil } from "./user-ctx-util";
export declare class CommandsUtil {
    private argentium;
    private slashCommandDataMap;
    private slashCommandSrcMap;
    private messageCtxCommandDataMap;
    private messageCtxCommandSrcMap;
    private userCtxCommandDataMap;
    private userCtxCommandSrcMap;
    private prefix;
    private suffix;
    private errorFn?;
    constructor(argentium: Argentium);
    use(fn: (util: CommandsUtil) => CommandsUtil): CommandsUtil;
    slash(fn: (util: SlashUtil) => SlashUtil<any, any>): this;
    message(fn: (util: MessageCtxUtil) => MessageCtxUtil<any, any>): this;
    user(fn: (util: UserCtxUtil) => UserCtxUtil<any, any>): this;
    beforeAll(fn: (t: {
        _: CommandInteraction | AutocompleteInteraction;
    } & Omit<any, "_">, escape: (t: any) => void) => any): this;
    afterAll(fn: (t: {
        _: CommandInteraction | AutocompleteInteraction;
    } & Omit<any, "_">) => any): this;
    error(fn: (e: any, t: {
        _: CommandInteraction | AutocompleteInteraction;
    } & Omit<any, "_">) => any): this;
    get commandArray(): (UserApplicationCommandData | MessageApplicationCommandData | ChatInputApplicationCommandData)[];
    apply(client: Client): Promise<void>;
}
