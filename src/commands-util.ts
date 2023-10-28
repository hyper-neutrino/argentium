import {
    ChatInputApplicationCommandData,
    Client,
    CommandInteraction,
    Events,
    InteractionType,
    MessageApplicationCommandData,
    UserApplicationCommandData,
} from "discord.js";
import Argentium from "../index.ts";
import { MessageCtxUtil } from "./message-ctx-util.ts";
import { SlashUtil } from "./slash-util.ts";
import { UserCtxUtil } from "./user-ctx-util.ts";

export class CommandsUtil {
    private slashCommandDataMap: Record<string, ChatInputApplicationCommandData> = {};
    private slashCommandSrcMap: Record<string, SlashUtil<any, any>> = {};
    private messageCtxCommandDataMap: Record<string, MessageApplicationCommandData> = {};
    private messageCtxCommandSrcMap: Record<string, MessageCtxUtil<any, any>> = {};
    private userCtxCommandDataMap: Record<string, UserApplicationCommandData> = {};
    private userCtxCommandSrcMap: Record<string, UserCtxUtil<any, any>> = {};
    private prefix: any[] = [];
    private suffix: any[] = [];
    private errorFn?: any;

    constructor(private argentium: Argentium) {}

    public use(fn: (util: CommandsUtil) => CommandsUtil) {
        return fn(this);
    }

    public slash(fn: (util: SlashUtil) => SlashUtil<any, any>) {
        const su = fn(new SlashUtil(this.argentium));
        su.apply(this.slashCommandDataMap, this.slashCommandSrcMap);

        return this;
    }

    public message(fn: (util: MessageCtxUtil) => MessageCtxUtil<any, any>) {
        const mcu = fn(new MessageCtxUtil(this.argentium));
        mcu.apply(this.messageCtxCommandDataMap, this.messageCtxCommandSrcMap);

        return this;
    }

    public user(fn: (util: UserCtxUtil) => UserCtxUtil<any, any>) {
        const ucu = fn(new UserCtxUtil(this.argentium));
        ucu.apply(this.userCtxCommandDataMap, this.userCtxCommandSrcMap);

        return this;
    }

    public beforeAll(fn: (t: { _: CommandInteraction } & Omit<any, "_">, escape: (t: any) => void) => any) {
        this.prefix.push(fn);
        return this;
    }

    public afterAll(fn: (t: { _: CommandInteraction } & Omit<any, "_">) => any) {
        this.suffix.push(fn);
        return this;
    }

    public error(fn: (e: any, t: { _: CommandInteraction & Omit<any, "_"> }) => any) {
        this.errorFn = fn;
        return this;
    }

    public async apply(client: Client) {
        for (const obj of [
            ...Object.values(this.slashCommandDataMap),
            ...Object.values(this.messageCtxCommandDataMap),
            ...Object.values(this.userCtxCommandDataMap),
        ])
            await client.application!.commands.create(obj);

        client.on(Events.InteractionCreate, async (i) => {
            if (i.type === InteractionType.ApplicationCommand) {
                const fmt = (k: any) => (typeof k === "string" ? { content: k } : k);
                const reply = (k: any) => (i.deferred ? i.editReply(fmt(k)) : i.replied ? i.followUp(fmt(k)) : i.reply(fmt(k)));

                if (i.isChatInputCommand()) {
                    const key = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)].filter((x) => x).join(" ");
                    const slash = this.slashCommandSrcMap[key];

                    if (slash) {
                        try {
                            const data = slash.getData(i);
                            let response: any;

                            for (const fn of this.prefix) {
                                await fn(data, (x: any) => (response = x));
                                if (response) break;
                            }

                            response ??= await slash.exec(data);

                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }

                            if (response != undefined) await reply(response);
                        } catch (e) {
                            const response = slash.willCatch
                                ? await slash.catch(e, i)
                                : this.errorFn
                                ? await this.errorFn(e, i)
                                : this.argentium.commandErrorFn?.(e, i);

                            if (response != undefined) await reply(response);
                        }
                    }
                } else if (i.isMessageContextMenuCommand()) {
                    const messageCtx = this.messageCtxCommandSrcMap[i.commandName];

                    if (messageCtx) {
                        try {
                            const data = { _: i, message: i.targetMessage };
                            let response: any;

                            for (const fn of this.prefix) {
                                await fn(data, (x: any) => (response = x));
                                if (response) break;
                            }

                            response ??= await messageCtx.exec(data);

                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }

                            if (response != undefined) await reply(response);
                        } catch (e) {
                            const response = messageCtx.willCatch
                                ? await messageCtx.catch(e, i)
                                : this.errorFn
                                ? await this.errorFn(e, i)
                                : this.argentium.commandErrorFn?.(e, i);
                            if (response != undefined) await reply(response);
                        }
                    }
                } else if (i.isUserContextMenuCommand()) {
                    const userCtx = this.userCtxCommandSrcMap[i.commandName];

                    if (userCtx) {
                        try {
                            const data = { _: i, user: i.targetUser };
                            let response: any;

                            for (const fn of this.prefix) {
                                await fn(data, (x: any) => (response = x));
                                if (response) break;
                            }

                            response ??= await userCtx.exec(data);

                            for (const fn of this.suffix) {
                                response = (await fn(response)) ?? response;
                            }

                            if (response != undefined) await reply(response);
                        } catch (e) {
                            const response = userCtx.willCatch
                                ? await userCtx.catch(e, i)
                                : this.errorFn
                                ? await this.errorFn(e, i)
                                : this.argentium.commandErrorFn?.(e, i);

                            if (response != undefined) await reply(response);
                        }
                    }
                }
            } else if (i.type === InteractionType.ApplicationCommandAutocomplete) {
                try {
                    const key = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)].filter((x) => x).join(" ");
                    const slash = this.slashCommandSrcMap[key];

                    const response = await slash.autocomplete(i);
                    if (response) await i.respond(response);
                } catch {}
            }
        });
    }
}
