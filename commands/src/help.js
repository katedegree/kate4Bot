export async function Help(interaction) {
  await interaction.reply(
    "## コマンド一覧\n```?help```\n## ボイスチャット入室\n```?join```\n## ボイスチャット退出\n```?leave```\n## ボイス変更\n```?set <voice_id>```\n## ボイスID一覧\n```?voice```\n"
  );
}
