import { ApplicationCommandType } from "discord.js";
export class UserCtxUtil {
    argentium;
    _name;
    chain = [];
    errorFn;
    constructor(argentium) {
        this.argentium = argentium;
    }
    use(fn) {
        return fn(this);
    }
    name(name) {
        this._name = name;
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
            throw new Error(`Missing name in user context command`);
        const name = this.argentium.localizeDefault(this._name);
        srcMap[name] = this;
        if (name in commandDataMap)
            throw new Error(`Conflicting commands with name ${this._name}`);
        commandDataMap[name] = { type: ApplicationCommandType.User, name, nameLocalizations: this.argentium.getLocalizations(this._name) };
        return this;
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
        await this.errorFn(e, cmd);
    }
}
