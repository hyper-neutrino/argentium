import { Events } from "discord.js";
import Argentium from "./index.ts";

await new Argentium()
    .beforeAllCommands((_, e) => e("escaped"))
    .commands((x) =>
        x
            .beforeAll(() => console.log("A"))
            .slash((x) =>
                x
                    .key("test-a")
                    .description("test command A")
                    .fn(() => {
                        throw "ok";
                    }),
            ),
    )
    .commands((x) =>
        x
            .beforeAll(() => console.log("B"))
            .error((e) => `${e}`)
            .slash((x) =>
                x
                    .key("test-b")
                    .description("test command B")
                    .fn(() => {
                        throw "ok";
                    }),
            ),
    )
    .onCommandError((e) => `! ${e}`)
    .on(Events.ClientReady, () => console.log("Ready!"))
    .client(Bun.env.TOKEN!, { intents: 0 });
