import { getVoiceConnection } from "@discordjs/voice";

export async function Leave(message) {
  const connection = getVoiceConnection(message.guild.id);

  if (!connection) {
    return message.reply("ボイスチャンネルに参加していません。");
  }

  connection.destroy(); // ボイスチャンネルから退出
  message.reply("VCから退出しました！");
}