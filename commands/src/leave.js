import { getVoiceConnection } from "@discordjs/voice";

export async function Leave(interaction) {
  const connection = getVoiceConnection(interaction.guild.id);

  if (!connection) {
    return interaction.reply("ボイスチャンネルに参加していません。");
  }

  connection.destroy(); // ボイスチャンネルから退出
  interaction.reply("VCから退出しました！");
}