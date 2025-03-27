import {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import axios from "axios";
import { PassThrough } from "stream";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { DB } from "../../db.js";

const queues = new Map();
const player = createAudioPlayer(); // プレイヤーを使い回す
const axiosInstance = axios.create({ 
  httpAgent: new HttpAgent({ keepAlive: true }),
  httpsAgent: new HttpsAgent({ keepAlive: true }),
});

export async function Read(message) {
  if (message.author.bot || !message.member.voice.channel) return;

  const serverId = message.guild.id;
  let queue = queues.get(serverId);
  if (!queue) {
    queue = [];
    queues.set(serverId, queue);
  }

  const connection = getVoiceConnection(serverId);
  if (!connection) {
    queues.delete(serverId);
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
  if (!queue || queue.length === 0) {
    queues.delete(serverId);
    return;
  }

  const { message, connection } = queue.shift();
  if (!getVoiceConnection(serverId)) {
    queues.delete(serverId);
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

    const { data: queryData } = await axiosInstance.post("http://voice:50021/audio_query", "", {
      headers: { accept: "application/json" },
      params: { text: formattedMessage, speaker: speaker },
    });

    const { data: synthesisStream } = await axiosInstance.post("http://voice:50021/synthesis", queryData, {
      params: { speaker: speaker },
      responseType: "stream",
    });

    const audioStream = new PassThrough({ highWaterMark: 1024 * 32 });
    synthesisStream.pipe(audioStream);

    const resource = createAudioResource(audioStream);
    player.play(resource);
    connection.subscribe(player);

    player.once(AudioPlayerStatus.Idle, () => playNext(serverId));
  } catch (error) {
    console.error("読み上げエラー:", error);
    playNext(serverId);
  }
}
