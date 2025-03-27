import { joinVoiceChannel } from "@discordjs/voice";

export async function Join(interaction) {
  const channel = interaction.member.voice.channel;

  if (!channel) {
    return interaction.reply("VCに入ってからコマンドを実行してください。");
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  interaction.reply("VCに参加しました！");
}
