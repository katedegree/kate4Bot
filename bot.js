import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { Help, Join, Leave, Set, Voice } from "./commands/index.js";
import { Read } from "./events/index.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  switch (interaction.commandName) {
    case "help":
      await Help(interaction);
      break;
    case "join":
      await Join(interaction);
      break;
    case "leave":
      await Leave(interaction);
      break;
    case "set":
      await Set(interaction);
      break;
    case "voice":
      await Voice(interaction);
      break;
    default:
      await interaction.reply("不明なコマンドです");
      break;
  }
});

client.on("messageCreate", async (message) => {
  await Read(message);
});

client.login(process.env.BOT_TOKEN);
