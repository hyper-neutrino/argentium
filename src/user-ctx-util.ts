import { ApplicationCommandType, User, UserApplicationCommandData, UserContextMenuCommandInteraction } from "discord.js";
import Argentium from "../index.ts";

export class UserCtxUtil<T = { _: UserContextMenuCommandInteraction; user: User }, U = undefined> {
    private _name?: string;
    private chain: any[] = [];
    private errorFn: any;

    constructor(private argentium: Argentium) {}

    public use<R1, R2>(fn: (util: UserCtxUtil<T, U>) => UserCtxUtil<R1, R2>) {
        return fn(this);
    }

    public name(name: string) {
        this._name = name;
        return this;
    }

    public fn<R>(fn: (t: U extends undefined ? T : U, og: T) => R) {
        this.chain.push(fn);

        return this as unknown as UserCtxUtil<
            T,
            R extends undefined | null | void | Promise<undefined | null | void> ? (U extends undefined ? T : U) : R extends Promise<infer M> ? M : R
        >;
    }

    public error(fn: (e: any, t: T) => any) {
        this.errorFn = fn;
        return this;
    }

    public apply(commandDataMap: Record<string, UserApplicationCommandData>, srcMap: Record<string, UserCtxUtil<any, any>>) {
        if (!this._name) throw new Error(`Missing name in user context command`);

        const name = this.argentium.localizeDefault(this._name);

        srcMap[name] = this;

        if (name in commandDataMap) throw new Error(`Conflicting commands with name ${this._name}`);

        commandDataMap[name] = { type: ApplicationCommandType.User, name, nameLocalizations: this.argentium.getLocalizations(this._name) };

        return this;
    }

    public async exec(data: any): Promise<T> {
        const og = data;
        let realData: any = undefined;
        for (const fn of this.chain) data = (realData = await fn(data, og)) ?? data;
        return realData;
    }

    public async catch(e: any, cmd: UserContextMenuCommandInteraction) {
        if (!this.errorFn) throw e;
        await this.errorFn(e, cmd);
    }
}
