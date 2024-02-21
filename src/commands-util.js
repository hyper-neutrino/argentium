import { Events, InteractionType, } from "discord.js";
import { MessageCtxUtil } from "./message-ctx-util";
import { SlashUtil } from "./slash-util";
import { UserCtxUtil } from "./user-ctx-util";
export class CommandsUtil {
    argentium;
    slashCommandDataMap = {};
    slashCommandSrcMap = {};
    messageCtxCommandDataMap = {};
    messageCtxCommandSrcMap = {};
    userCtxCommandDataMap = {};
    userCtxCommandSrcMap = {};
    prefix = [];
    suffix = [];
    errorFn;
    constructor(argentium) {
        this.argentium = argentium;
    }
    use(fn) {
        return fn(this);
    }
    slash(fn) {
        const su = fn(new SlashUtil(this.argentium));
        su.apply(this.slashCommandDataMap, this.slashCommandSrcMap);
        return this;
    }
    message(fn) {
        const mcu = fn(new MessageCtxUtil(this.argentium));
        mcu.apply(this.messageCtxCommandDataMap, this.messageCtxCommandSrcMap);
        return this;
    }
    user(fn) {
        const ucu = fn(new UserCtxUtil(this.argentium));
        ucu.apply(this.userCtxCommandDataMap, this.userCtxCommandSrcMap);
        return this;
    }
    beforeAll(fn) {
        this.prefix.push(fn);
        return this;
    }
    afterAll(fn) {
        this.suffix.push(fn);
        return this;
    }
    error(fn) {
        this.errorFn = fn;
        return this;
    }
    get commandArray() {
        return [...Object.values(this.slashCommandDataMap), ...Object.values(this.messageCtxCommandDataMap), ...Object.values(this.userCtxCommandDataMap)];
    }
    async apply(client) {
        client.on(Events.InteractionCreate, async (i) => {
            if (i.type === InteractionType.ApplicationCommand) {
                const fmt = (k) => (typeof k === "string" ? { content: k } : k);
                const reply = (k) => (i.deferred ? i.editReply(fmt(k)) : i.replied ? i.followUp(fmt(k)) : i.reply(fmt(k)));
                if (i.isChatInputCommand()) {
                    const key = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)].filter((x) => x).join(" ");
                    const slash = this.slashCommandSrcMap[key];
                    if (slash) {
                        try {
                            const data = slash.getData(i);
                            let response;
                            for (const fn of [...this.argentium.commandPrefix, ...this.prefix]) {
                                await fn(data, (x) => (response = x));
                                if (response)
                                    break;
                            }
                            response ??= await slash.exec(data);
                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }
                            if (response != undefined)
                                await reply(response);
                        }
                        catch (e) {
                            const response = slash.willCatch
                                ? await slash.catch(e, i)
                                : this.errorFn
                                    ? await this.errorFn(e, i)
                                    : this.argentium.commandErrorFn
                                        ? await this.argentium.commandErrorFn(e, i)
                                        : undefined;
                            if (response != undefined)
                                await reply(response);
                        }
                    }
                }
                else if (i.isMessageContextMenuCommand()) {
                    const messageCtx = this.messageCtxCommandSrcMap[i.commandName];
                    if (messageCtx) {
                        try {
                            const data = { _: i, message: i.targetMessage };
                            let response;
                            for (const fn of this.prefix) {
                                await fn(data, (x) => (response = x));
                                if (response)
                                    break;
                            }
                            response ??= await messageCtx.exec(data);
                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }
                            if (response != undefined)
                                await reply(response);
                        }
                        catch (e) {
                            const response = messageCtx.willCatch
                                ? await messageCtx.catch(e, i)
                                : this.errorFn
                                    ? await this.errorFn(e, i)
                                    : this.argentium.commandErrorFn
                                        ? await this.argentium.commandErrorFn(e, i)
                                        : undefined;
                            if (response != undefined)
                                await reply(response);
                        }
                    }
                }
                else if (i.isUserContextMenuCommand()) {
                    const userCtx = this.userCtxCommandSrcMap[i.commandName];
                    if (userCtx) {
                        try {
                            const data = { _: i, user: i.targetUser };
                            let response;
                            for (const fn of this.prefix) {
                                await fn(data, (x) => (response = x));
                                if (response)
                                    break;
                            }
                            response ??= await userCtx.exec(data);
                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }
                            if (response != undefined)
                                await reply(response);
                        }
                        catch (e) {
                            const response = userCtx.willCatch
                                ? await userCtx.catch(e, i)
                                : this.errorFn
                                    ? await this.errorFn(e, i)
                                    : this.argentium.commandErrorFn
                                        ? await this.argentium.commandErrorFn(e, i)
                                        : undefined;
                            if (response != undefined)
                                await reply(response);
                        }
                    }
                }
            }
            else if (i.type === InteractionType.ApplicationCommandAutocomplete) {
                try {
                    const key = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)].filter((x) => x).join(" ");
                    const slash = this.slashCommandSrcMap[key];
                    let response;
                    for (const fn of [...this.argentium.commandPrefix, ...this.prefix]) {
                        await fn({ _: i }, (x) => (response = x));
                        if (response)
                            break;
                    }
                    response ??= await slash.autocomplete(i);
                    if (response)
                        await i.respond(response);
                }
                catch { }
            }
        });
    }
}
