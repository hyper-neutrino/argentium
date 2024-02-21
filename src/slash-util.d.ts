import { APIRole, Attachment, AutocompleteInteraction, Awaitable, Channel, ChannelType, ChatInputApplicationCommandData, ChatInputCommandInteraction, Role, User } from "discord.js";
import Argentium from "..";
import { Extend } from "./type-utils";
export declare class SlashUtil<T = {
    _: ChatInputCommandInteraction;
}, U = undefined> {
    private argentium;
    private _name?;
    private _group?;
    private _sub?;
    private _description?;
    private autocompletes;
    private options;
    private chain;
    private errorFn;
    constructor(argentium: Argentium);
    use<R1, R2>(fn: (util: SlashUtil<T, U>) => SlashUtil<R1, R2>): SlashUtil<R1, R2>;
    key(key: string): this;
    description(description: string): this;
    stringOption<K extends string, V extends Record<string, string>, R extends boolean = false>(name: K, description: string, options?: {
        maxLength?: number;
        minLength?: number;
        autocomplete?: (query: string, interaction: AutocompleteInteraction) => Awaitable<(string | [string, string] | {
            name: string;
            value: string;
        })[] | Record<string, string> | undefined | null | void>;
        required?: R;
        choices?: V;
    }): Extend<T, U, K, R, keyof V>;
    numberOption<K extends string, V extends Record<number, string>, R extends boolean = false>(name: K, description: string, options?: {
        float?: boolean;
        maximum?: number;
        minimum?: number;
        autocomplete?: (query: string, interaction: AutocompleteInteraction) => Awaitable<(number | [number, string] | {
            name: string;
            value: number;
        })[] | Record<number, string> | undefined | null | void>;
        required?: R;
        choices?: V;
    }): Extend<T, U, K, R, keyof V>;
    booleanOption<K extends string, R extends boolean = false>(name: K, description: string, options?: {
        required?: R;
    }): Extend<T, U, K, R, boolean>;
    userOption<K extends string, R extends boolean = false>(name: K, description: string, options?: {
        required?: R;
    }): Extend<T, U, K, R, User>;
    channelOption<K extends string, R extends boolean = false, C extends ChannelType | undefined = undefined>(name: K, description: string, options?: {
        required?: R;
        channelTypes?: readonly C[];
    }): Extend<T, U, K, R, C extends undefined ? Channel : Extract<import("discord.js").CategoryChannel, {
        type: C;
    }> | Extract<import("discord.js").DMChannel, {
        type: C;
    }> | Extract<import("discord.js").PartialDMChannel, {
        type: C;
    }> | Extract<import("discord.js").PartialGroupDMChannel, {
        type: C;
    }> | Extract<import("discord.js").NewsChannel, {
        type: C;
    }> | Extract<import("discord.js").StageChannel, {
        type: C;
    }> | Extract<import("discord.js").TextChannel, {
        type: C;
    }> | Extract<import("discord.js").PrivateThreadChannel, {
        type: C;
    }> | Extract<import("discord.js").PublicThreadChannel<boolean>, {
        type: C;
    }> | Extract<import("discord.js").VoiceChannel, {
        type: C;
    }> | Extract<import("discord.js").ForumChannel, {
        type: C;
    }>>;
    roleOption<K extends string, R extends boolean = false>(name: K, description: string, options?: {
        required?: R;
    }): Extend<T, U, K, R, Role | APIRole>;
    mentionableOption<K extends string, R extends boolean = false>(name: K, description: string, options?: {
        required?: R;
    }): Extend<T, U, K, R, Role | User | APIRole>;
    fileOption<K extends string, R extends boolean = false>(name: K, description: string, options?: {
        required?: R;
    }): Extend<T, U, K, R, Attachment>;
    fn<R>(fn: (t: U extends undefined ? T : U, og: T) => R): SlashUtil<T, R extends void | Promise<void | null | undefined> | null | undefined ? U extends undefined ? T : U : R extends Promise<infer M> ? M : R>;
    error(fn: (e: any, t: T) => any): this;
    apply(commandDataMap: Record<string, ChatInputApplicationCommandData>, srcMap: Record<string, SlashUtil<any, any>>): this;
    getData(cmd: ChatInputCommandInteraction): any;
    autocomplete(ai: AutocompleteInteraction): Promise<any[] | undefined>;
    exec(data: any): Promise<T>;
    get willCatch(): boolean;
    catch(e: any, cmd: ChatInputCommandInteraction): Promise<void>;
}
