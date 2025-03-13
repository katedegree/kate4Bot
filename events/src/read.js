import {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} from "@discordjs/voice";
import axios from "axios";
import fs from "fs";
import { pipeline } from "stream";
import util from "util";
import { DB } from "../../db.js";

const pipelineAsync = util.promisify(pipeline);

const requestQueue = []; // 音声リクエストを管理するキュー
let isProcessing = false; // 音声処理中かどうかのフラグ

// 音声リクエスト処理の関数
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;

  const { message, connection } = requestQueue.shift(); // キューからリクエストを取り出す
  isProcessing = true; // 処理開始

  try {
    const [voice] = await DB("SELECT speaker FROM voices WHERE user_id = $1", [
      message.author.id,
    ]);

    const queryRes = await axios.post(
      "http://voice:50021/audio_query",
      "", // -d '' に対応
      {
        headers: {
          accept: "application/json", // accept ヘッダー追加
        },
        params: { text: message.content, speaker: voice.speaker || 1 },
      }
    );

    // VOICEVOX API: 音声合成
    const synthesisRes = await axios.post(
      "http://voice:50021/synthesis",
      queryRes.data,
      {
        params: { speaker: voice.speaker || 1 },
        responseType: "stream", // 音声データをストリームで受け取る
      }
    );

    // 音声ファイルを保存
    const filePath = `./voice_${Date.now()}.wav`;
    await pipelineAsync(synthesisRes.data, fs.createWriteStream(filePath));

    // 音声を再生
    const player = createAudioPlayer();
    const resource = createAudioResource(filePath);
    player.play(resource);
    connection.subscribe(player);

    // 再生終了後、ファイルを削除し、次のリクエストを処理
    player.on(AudioPlayerStatus.Idle, () => {
      fs.unlinkSync(filePath);
      isProcessing = false; // 処理終了
      processQueue(); // 次のリクエストを処理
    });
  } catch (error) {
    console.error("読み上げエラー:", error);
    isProcessing = false; // エラー発生時にもフラグを戻す
    processQueue(); // 次のリクエストを処理
  }
}

export async function Read(message) {
  if (message.author.bot) return;
  if (!message.member.voice.channel) return;

  const voiceChannel = message.member.voice.channel;
  const connection = getVoiceConnection(voiceChannel.guild.id);
  if (!connection) return;

  // リクエストをキューに追加
  requestQueue.push({ message, connection });

  // キューの処理を開始
  processQueue();
}
