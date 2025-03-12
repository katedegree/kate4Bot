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

client.on("messageCreate", async (message) => {
  switch (message.content.split(" ")[0]) {
    case "?help":
      Help(message);
      break;
    case "?join":
      Join(message);
      break;
    case "?leave":
      Leave(message);
      break;
    case "?set":
      Set(message);
      break;
    case "?voice":
      Voice(message);
      break;
    default:
      Read(message);
      break;
  }
});

client.login(process.env.BOT_TOKEN);
