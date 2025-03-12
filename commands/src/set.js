import { DB } from "../../db.js";
import axios from "axios";

export async function Set(message) {
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return;

  const speakerId = message.content.split(" ")[1];

  const speakersRes = await axios
    .get("http://voice:50021/speakers")
    .then((res) => res.data);

  try {
    await DB(
      `INSERT INTO voices (user_id, speaker) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id) 
             DO UPDATE SET speaker = EXCLUDED.speaker RETURNING *`,
      [message.author.id, speakerId]
    );

    for (const speaker of speakersRes) {
      for (const style of speaker.styles) {
        if (style.id === Number(speakerId)) {
          message.channel.send(
            `${speaker.name}（${style.name}）に設定しました。`
          );
          return;
        }
      }
    }
  } catch (err) {
    console.error("Error inserting/updating data:", err);
  }
}
