import { ApplicationCommandType, Message, MessageApplicationCommandData, MessageContextMenuCommandInteraction } from "discord.js";
import Argentium from "../index.ts";

export class MessageCtxUtil<T = { _: MessageContextMenuCommandInteraction; message: Message }, U = undefined> {
    private _name?: string;
    private chain: any[] = [];
    private errorFn: any;

    constructor(private argentium: Argentium) {}

    public name(name: string) {
        this._name = name;
        return this;
    }

    public fn<R>(fn: (t: U extends undefined ? T : U, og: T) => R) {
        this.chain.push(fn);

        return this as unknown as MessageCtxUtil<
            T,
            R extends undefined | null | void | Promise<undefined | null | void> ? (U extends undefined ? T : U) : R extends Promise<infer M> ? M : R
        >;
    }

    public error(fn: (e: any, t: T) => any) {
        this.errorFn = fn;
        return this;
    }

    public apply(commandDataMap: Record<string, MessageApplicationCommandData>, srcMap: Record<string, MessageCtxUtil<any, any>>) {
        if (!this._name) throw new Error(`Missing name in message context command`);

        const name = this.argentium.localizeDefault(this._name);

        srcMap[name] = this;

        if (name in commandDataMap) throw new Error(`Conflicting commands with name ${this._name}`);

        commandDataMap[name] = { type: ApplicationCommandType.Message, name, nameLocalizations: this.argentium.getLocalizations(this._name) };

        return this;
    }

    public async exec(data: any): Promise<T> {
        const og = data;
        let realData: any = undefined;
        for (const fn of this.chain) data = (realData = await fn(data, og)) ?? data;
        return realData;
    }

    public async catch(e: any, cmd: MessageContextMenuCommandInteraction) {
        if (!this.errorFn) throw e;
        await this.errorFn(e, cmd);
    }
}
