import AeroClient from "@aeroware/aeroclient";
import { Intents, Message } from "discord.js";
import { config as dotenv } from "dotenv";
import Player from "./classes/Player";

dotenv();

const prefix = ".";
const client = new AeroClient(
    {
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
        async readyCallback() {
            console.log("Ready!");
            await Promise.all(client.guilds.cache.map((g) => g.members.fetch()));
        },
    },
    {
        ws: { intents: [Intents.NON_PRIVILEGED, "GUILD_MEMBERS"] },
    }
);

let inProgress = false;

client.registerCommand({
    name: "game",
    aliases: ["amongus", "au"],
    args: false,
    category: "among us",
    cooldown: 3600,
    description: "Starts an among us game.",
    details: "Starts an among us game by setting up the server. Play is contained within a category named 'The Skeld'.",
    guildOnly: true,
    usage: "[max players] [color]",
    async callback({ message, args, client }) {
        if (inProgress) {
            message.channel.send("Another game is in progress.");
            return "invalid";
        }

        inProgress = true;
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

        let chosenColor = colors.includes(args[1]) ? args[1] : colors.shift();
        const players = [new Player(message.author.id, chosenColor)];

        const startMessage = await message.channel.send(
            `**<@!${
                message.author
            }> has started an among us game! Type \`${prefix}join [color]\` to join!**\n*${maxPlayers} players max*\nPlayers:\n${players
                .map((p) => `<@!${p.id}>`)
                .join("\n")}`
        );

        const joinedPlayers = await message.channel.awaitMessages(
            async (msg: Message) => {
                if (!msg.content.startsWith(`${prefix}join`) || msg.author.bot) return false;

                if (players.map((p) => p.id).includes(msg.author.id)) {
                    message.channel.send(`<@!${msg.author.id}>, you have joined already!`);
                    return false;
                }

                const color = msg.content.split(/\s/g)[1];
                if (!colors.includes(color)) {
                    message.channel.send("Invalid color; defaulting to random.");
                }

                players.push(new Player(msg.author.id, colors.shift()!));

                await startMessage.edit(
                    `**<@!${
                        message.author
                    }> has started an among us game! Type \`${prefix}join [color]\` to join!**\n*${maxPlayers} players max*\nPlayers:\n${players
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
            inProgress = false;
            return;
        }

        // if (joinedPlayers.size < 3) {
        //     message.channel.send("Not enought people joined.");
        //     inProgress = false;
        //     return;
        // }

        const preparing = await message.channel.send("Preparing the server...");

        const { guild } = message;

        const theSkeld = await guild.channels.create("The Skeld", {
            type: "category",
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"],
                },
            ],
            position: 0,
        });

        for (const color of colors) {
            const role = await guild.roles.create({
                data: {
                    name: color,
                    color: colorsToHex[color],
                    mentionable: false,
                },
            });

            const player = players.find((p) => p.color === color);
            const member = guild.members.cache.find((m) => m.id === player.id);

            if (!member) message.channel.send(`<@!${player.id}> was not found in the cache.`);
        }

        for (const channel of [
            "cafeteria",
            "medbay",
            "weapons",
            "shields",
            "upper-engine",
            "lower-engine",
            "reactor",
            "storage",
            "communications",
            "admin",
            "o2",
            "navigation",
            "security",
            "electrical",
        ]) {
            await guild.channels.create(channel, {
                parent: theSkeld.id,
                topic: "Among Us – discord.js edition",
                type: "text",
            });
        }
    },
});
