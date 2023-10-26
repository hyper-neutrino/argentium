import { ChannelType } from "discord.js";
import Argentium from "./index.ts";

await new Argentium()
    .commands((x) =>
        x.slash((x) =>
            x
                .key("test")
                .description("test command")
                .stringOption("test", "test option", { required: true, autocomplete: (q) => [q || "...", ["a", "b"]] })
                .numberOption("test-number", "test option 2", { choices: { 1: "x", 2: "y" } })
                .channelOption("test-channel", "test option 3", { channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement] })
                .fn(({ _, ...x }) => `\`\`\`json\n${JSON.stringify(x, undefined, 4)}\n\`\`\``),
        ),
    )
    .ready(() => console.log("Ready!"))
    .client(Bun.env.TOKEN!, { intents: 0 });
