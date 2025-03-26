import {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
} from "@discordjs/voice";
import axios from "axios";
import { PassThrough } from "stream";
import { DB } from "../../db.js";

export async function Read(message) {
  if (message.author.bot || !message.member.voice.channel) return;

  const connection = getVoiceConnection(message.member.voice.channel.guild.id);
  if (!connection) return;

  try {
    const [[voice], queryRes] = await Promise.all([
      DB("SELECT speaker FROM voices WHERE user_id = $1", [message.author.id]),
      axios.post("http://voice:50021/audio_query", "", {
        headers: { accept: "application/json" },
        params: { text: message.content, speaker: 1 },
      }),
    ]);

    const synthesisRes = await axios.post(
      "http://voice:50021/synthesis",
      queryRes.data,
      {
        params: { speaker: voice?.speaker ?? 1 },
        responseType: "stream",
      }
    );

    // ストリームで直接再生
    const player = createAudioPlayer();
    const audioStream = new PassThrough();
    synthesisRes.data.pipe(audioStream);

    const resource = createAudioResource(audioStream);
    player.play(resource);
    connection.subscribe(player);
  } catch (error) {
    console.error("読み上げエラー:", error);
  }
}
