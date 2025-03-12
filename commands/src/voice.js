import axios from "axios";

export async function Voice(message) {
  const speakersRes = await axios
    .get("http://voice:50021/speakers")
    .then((res) => res.data);

  const speakers = [];
  for (const speaker of speakersRes) {
    speakers.push(
      speaker.styles.map((style) => ({
        id: style.id,
        name: `${speaker.name}（${style.name}）`,
      }))
    );
  }

  for (const speaker of speakers) {
    message.channel.send(
      speaker
        .map((speaker) => "- " + speaker.id + ": " + speaker.name)
        .join("\n")
    );
  }
}
