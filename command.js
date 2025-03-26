import { REST, Routes, ApplicationCommandOptionType } from "discord.js";
import "dotenv/config";

const commands = [
  {
    name: "help",
    description: "ヘルプを表示します",
  },
  {
    name: "join",
    description: "ボイスチャンネルに参加します",
  },
  {
    name: "leave",
    description: "ボイスチャンネルから退出します",
  },
  {
    name: "set",
    description: "ボイス設定を変更します",
    options: [
      {
        name: "speaker_id",
        type: ApplicationCommandOptionType.Integer,
        description: "ボイスIDを選択します",
        required: true,
        min_value: 0,
        max_value: 98,
      },
    ],
  },
  {
    name: "voice",
    description: "ボイス一覧を表示します",
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("スラッシュコマンドを登録中...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("スラッシュコマンドの登録完了！");
  } catch (error) {
    console.error("コマンド登録エラー:", error);
  }
})();
