import {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import axios from "axios";
import { PassThrough } from "stream";
import { DB } from "../../db.js";

const queue = [];
let isPlaying = false;

export async function Read(message) {
  if (message.author.bot || !message.member.voice.channel) return;

  const connection = getVoiceConnection(message.guild.id);

  // VCが切断されていたらキューをクリアして終了
  if (!connection) {
    queue.length = 0;
    isPlaying = false;
    console.log("VCが切断されたため、キューをクリアしました");
    return;
  }

  queue.push({ message, connection });
  if (!isPlaying) {
    playNext();
  }
}

async function playNext() {
  if (queue.length === 0) {
    isPlaying = false;
    return;
  }

  const { message, connection } = queue.shift();

  // VCが切断されていたらキューをクリアして終了
  if (!getVoiceConnection(message.guild.id)) {
    queue.length = 0;
    isPlaying = false;
    console.log("VCが切断されたため、キューをクリアしました");
    return;
  }

  isPlaying = true;

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

    const player = createAudioPlayer();
    const audioStream = new PassThrough();
    synthesisRes.data.pipe(audioStream);

    const resource = createAudioResource(audioStream);
    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      playNext();
    });
  } catch (error) {
    console.error("読み上げエラー:", error);
    playNext();
  }
}
