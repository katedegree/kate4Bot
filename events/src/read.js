import {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import axios from "axios";
import { PassThrough } from "stream";
import { DB } from "../../db.js";

const queues = new Map();

export async function Read(message) {
  if (message.author.bot || !message.member.voice.channel) return;

  const serverId = message.guild.id;
  if (!queues.has(serverId)) {
    queues.set(serverId, []);
  }

  const queue = queues.get(serverId);
  const connection = getVoiceConnection(serverId);

  if (!connection) {
    queue.length = 0;
    console.log("VCが切断されたため、キューをクリアしました");
    return;
  }

  queue.push({ message, connection });
  if (queue.length === 1) {
    playNext(serverId);
  }
}

async function playNext(serverId) {
  const queue = queues.get(serverId);
  if (!queue || queue.length === 0) return;

  const { message, connection } = queue.shift();

  if (!getVoiceConnection(serverId)) {
    queue.length = 0;
    console.log("VCが切断されたため、キューをクリアしました");
    return;
  }

  const formattedMessage =
    message.content.length <= 50
      ? message.content
      : message.content.substring(0, 50) + "いかしょうりゃく";

  try {
    const [voiceResult] = await DB("SELECT speaker FROM voices WHERE user_id = $1", [message.author.id]);
    const speaker = voiceResult?.speaker ?? 1;

    const queryRes = await axios.post("http://voice:50021/audio_query", "", {
      headers: { accept: "application/json" },
      params: {
        text: formattedMessage,
        speaker: speaker
      },
    });

    const synthesisRes = await axios.post(
      "http://voice:50021/synthesis",
      queryRes.data,
      {
        params: { speaker: speaker },
        responseType: "stream",
      }
    );

    const player = createAudioPlayer();
    const audioStream = new PassThrough({ highWaterMark: 1024 * 64 });
    synthesisRes.data.pipe(audioStream);

    const resource = createAudioResource(audioStream);
    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      playNext(serverId);
    });
  } catch (error) {
    console.error("読み上げエラー:", error);
    playNext(serverId);
  }
}
