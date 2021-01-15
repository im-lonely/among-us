import AeroClient from "@aeroware/aeroclient";
import { Message } from "discord.js";
import { config as dotenv } from "dotenv";
import Player from "./classes/Player";

dotenv();

const prefix = ".";
const client = new AeroClient({
    token: process.env.TOKEN,
    prefix,
    useDefaults: true,
    logging: true,
    responses: {
        guarded: "u fool that command cant be disabled",
        cooldown: "smh wait $TIME then try `$COMMAND` again, impatient dumbass",
        usage: "bruh you use `$COMMAND` like this: `$PREFIX$COMMAND $USAGE`",
        guild: "lmao and you thought you could use that command",
        disabled: "smh this command was disabled",
    },
});

client.registerCommand({
    name: "game",
    async callback({ message, args, client }) {
        let maxPlayers = parseInt(args[0]) || 8;

        if (maxPlayers < 4) maxPlayers = 4;
        if (maxPlayers > 12) maxPlayers = 12;

        const colorsToHex = {
            red: "#ff0000",
            green: "#00ff00",
            blue: "#0000ff",
            cyan: "#00ffff",
            white: "#ffffff",
            orange: "#ffaa00",
        };

        const colors = ["red", "green", "blue", "cyan", "white", "orange"]
            .sort(() => Math.random() - 0.5)
            .reverse()
            .sort(() => Math.random() - 0.5);

        const players = [new Player(message.author.id, colors.shift())];

        const startMessage = await message.channel.send(
            `**<@!${message.author}> has started an among us game! Type \`${prefix}join\` to join!**\n*${maxPlayers} players max*\nPlayers:\n${players
                .map((p) => `<@!${p.id}>`)
                .join("\n")}`
        );

        const joinedPlayers = await message.channel.awaitMessages(
            async (msg: Message) => {
                if (msg.content.toLowerCase() !== `${prefix}join` || msg.author.bot) return false;

                if (players.map((p) => p.id).includes(msg.author.id)) {
                    message.channel.send(`<@!${msg.author.id}>, you have joined already!`);
                    return false;
                }

                players.push(new Player(msg.author.id, colors.shift()!));

                await startMessage.edit(
                    `**<@!${
                        message.author
                    }> has started an among us game! Type \`${prefix}join\` to join!**\n*${maxPlayers} players max*\nPlayers:\n${players
                        .map((p) => `<@!${p.id}>`)
                        .join("\n")}`
                );

                message.channel.send(`<@!${msg.author.id}> joined the game!`);

                msg.delete();

                return true;
            },
            {
                max: maxPlayers - 1,
                time: 30000,
            }
        );

        if (!joinedPlayers.size) {
            message.channel.send("Nobody joined your game.");
            this.inProgress = false;
            return;
        }

        const preparing = await message.channel.send("Preparing the server...");
    },
});
