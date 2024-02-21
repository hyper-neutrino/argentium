import { Message, MessageApplicationCommandData, MessageContextMenuCommandInteraction } from "discord.js";
import Argentium from "..";
export declare class MessageCtxUtil<T = {
    _: MessageContextMenuCommandInteraction;
    message: Message;
}, U = undefined> {
    private argentium;
    private _name?;
    private chain;
    private errorFn;
    constructor(argentium: Argentium);
    use<R1, R2>(fn: (util: MessageCtxUtil<T, U>) => MessageCtxUtil<R1, R2>): MessageCtxUtil<R1, R2>;
    name(name: string): this;
    fn<R>(fn: (t: U extends undefined ? T : U, og: T) => R): MessageCtxUtil<T, R extends void | Promise<void | null | undefined> | null | undefined ? U extends undefined ? T : U : R extends Promise<infer M> ? M : R>;
    error(fn: (e: any, t: T) => any): this;
    apply(commandDataMap: Record<string, MessageApplicationCommandData>, srcMap: Record<string, MessageCtxUtil<any, any>>): this;
    exec(data: any): Promise<T>;
    get willCatch(): boolean;
    catch(e: any, cmd: MessageContextMenuCommandInteraction): Promise<void>;
}
