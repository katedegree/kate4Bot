import { joinVoiceChannel } from "@discordjs/voice";

export async function Join(message) {
  const channel = message.member.voice.channel;
  if (!channel) {
    return message.reply("VCに入ってからコマンドを実行してください。");
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
  });

  message.reply("VCに参加しました！");
}
