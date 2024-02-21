import { User, UserApplicationCommandData, UserContextMenuCommandInteraction } from "discord.js";
import Argentium from "..";
export declare class UserCtxUtil<T = {
    _: UserContextMenuCommandInteraction;
    user: User;
}, U = undefined> {
    private argentium;
    private _name?;
    private chain;
    private errorFn;
    constructor(argentium: Argentium);
    use<R1, R2>(fn: (util: UserCtxUtil<T, U>) => UserCtxUtil<R1, R2>): UserCtxUtil<R1, R2>;
    name(name: string): this;
    fn<R>(fn: (t: U extends undefined ? T : U, og: T) => R): UserCtxUtil<T, R extends void | Promise<void | null | undefined> | null | undefined ? U extends undefined ? T : U : R extends Promise<infer M> ? M : R>;
    error(fn: (e: any, t: T) => any): this;
    apply(commandDataMap: Record<string, UserApplicationCommandData>, srcMap: Record<string, UserCtxUtil<any, any>>): this;
    exec(data: any): Promise<T>;
    get willCatch(): boolean;
    catch(e: any, cmd: UserContextMenuCommandInteraction): Promise<void>;
}
