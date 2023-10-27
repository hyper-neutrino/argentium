import {
    ApplicationCommandType,
    ChatInputApplicationCommandData,
    Client,
    CommandInteraction,
    Events,
    InteractionType,
    MessageApplicationCommandData,
} from "discord.js";
import Argentium from "../index.ts";
import { MessageCtxUtil } from "./message-ctx-util.ts";
import { SlashUtil } from "./slash-util.ts";

export class CommandsUtil {
    private slashCommandDataMap: Record<string, ChatInputApplicationCommandData> = {};
    private slashCommandSrcMap: Record<string, SlashUtil<any, any>> = {};
    private messageCtxCommandDataMap: Record<string, MessageApplicationCommandData> = {};
    private messageCtxCommandSrcMap: Record<string, MessageCtxUtil<any, any>> = {};
    private prefix: any[] = [];
    private suffix: any[] = [];

    constructor(private argentium: Argentium) {}

    public slash(fn: (util: SlashUtil) => SlashUtil<any, any>) {
        const su = fn(new SlashUtil(this.argentium));
        su.apply(this.slashCommandDataMap, this.slashCommandSrcMap);

        return this;
    }

    public messageCtx(fn: (util: MessageCtxUtil) => MessageCtxUtil<any, any>) {
        const mcu = fn(new MessageCtxUtil(this.argentium));
        mcu.apply(this.messageCtxCommandDataMap, this.messageCtxCommandSrcMap);

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

    public async apply(client: Client) {
        await client.application!.commands.set([...Object.values(this.slashCommandDataMap), ...Object.values(this.messageCtxCommandDataMap)]);

        client.on(Events.InteractionCreate, async (i) => {
            if (i.type === InteractionType.ApplicationCommand) {
                const fmt = (k: any) => (typeof k === "string" ? { content: k } : k);
                const reply = (k: any) => (i.deferred ? i.editReply(fmt(k)) : i.replied ? i.followUp(fmt(k)) : i.reply(fmt(k)));

                if (i.commandType === ApplicationCommandType.ChatInput) {
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
                            const response = await slash.catch(e, i);
                            if (response != undefined) await reply(response);
                        }
                    }
                } else if (i.commandType === ApplicationCommandType.Message) {
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
                            const response = await messageCtx.catch(e, i);
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
