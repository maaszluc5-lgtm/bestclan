const {
  Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder,
  REST, Routes, ApplicationCommandOptionType, ChannelType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ]
});

const OWNER_ID = '1447174849628868681';

const RAENGE = [
  { name: '🎮 Spieler' }, { name: '💙 Supporter' }, { name: '🎨 Content' },
  { name: '🛡️ Moderator' }, { name: '⚙️ Admin' }, { name: '👴 OG' },
  { name: '🪙 Platin' }, { name: '🔱 Supreme' }, { name: '💎 Ultra' }, { name: '👑 Legendär' },
];

const USER_OPT = { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: true };
const USER_OPT_OPT = { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: false };
const GRUND_OPT = { name: 'grund', description: 'Grund', type: ApplicationCommandOptionType.String, required: false };
const TEXT_OPT = { name: 'text', description: 'Text', type: ApplicationCommandOptionType.String, required: true };
const ZAHL_OPT = { name: 'zahl', description: 'Zahl', type: ApplicationCommandOptionType.Integer, required: true };

const commands = [
  // ===== USER MANAGEMENT =====
  { name: 'nick', description: '✏️ Nickname ändern', options: [USER_OPT, { name: 'nickname', description: 'Neuer Nickname', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'nick_reset', description: '🔄 Nickname zurücksetzen', options: [USER_OPT] },
  { name: 'rang', description: '🏆 Rang vergeben', options: [USER_OPT, { name: 'rang', description: 'Rang', type: ApplicationCommandOptionType.String, required: true, choices: RAENGE.map((r, i) => ({ name: r.name, value: String(i + 1) })) }] },
  { name: 'rang_entfernen', description: '❌ Rang entfernen', options: [USER_OPT] },
  { name: 'kick', description: '👢 User kicken', options: [USER_OPT, GRUND_OPT] },
  { name: 'ban', description: '🔨 User bannen', options: [USER_OPT, GRUND_OPT] },
  { name: 'unban', description: '✅ User entbannen', options: [{ name: 'user_id', description: 'User ID', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'mute', description: '🔇 User stumm', options: [USER_OPT, { name: 'minuten', description: 'Minuten', type: ApplicationCommandOptionType.Integer, required: false }] },
  { name: 'unmute', description: '🔊 User entstummen', options: [USER_OPT] },
  { name: 'warn', description: '⚠️ User verwarnen', options: [USER_OPT, TEXT_OPT] },
  { name: 'user_info', description: 'ℹ️ User Info', options: [USER_OPT_OPT] },
  { name: 'avatar', description: '🖼️ Avatar anzeigen', options: [USER_OPT_OPT] },
  { name: 'dm', description: '📨 DM an User senden', options: [USER_OPT, TEXT_OPT] },
  { name: 'voice_kick', description: '🎙️ User aus Voice kicken', options: [USER_OPT] },
  { name: 'voice_move', description: '🔀 User in Voice-Kanal verschieben', options: [USER_OPT, { name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: true }] },
  { name: 'voice_mute', description: '🔇 User in Voice stummschalten', options: [USER_OPT] },
  { name: 'voice_unmute', description: '🔊 User in Voice entstummen', options: [USER_OPT] },
  { name: 'voice_deafen', description: '🔕 User taubschalten', options: [USER_OPT] },
  { name: 'voice_undeafen', description: '🔔 User entstaubschalten', options: [USER_OPT] },

  // ===== ROLLEN =====
  { name: 'rolle_geben', description: '🎭 Rolle geben', options: [USER_OPT, { name: 'rolle', description: 'Rolle', type: ApplicationCommandOptionType.Role, required: true }] },
  { name: 'rolle_entfernen', description: '🎭 Rolle entfernen', options: [USER_OPT, { name: 'rolle', description: 'Rolle', type: ApplicationCommandOptionType.Role, required: true }] },
  { name: 'rolle_erstellen', description: '➕ Neue Rolle erstellen', options: [{ name: 'name', description: 'Name', type: ApplicationCommandOptionType.String, required: true }, { name: 'farbe', description: 'Farbe (hex)', type: ApplicationCommandOptionType.String, required: false }] },
  { name: 'rolle_loeschen', description: '🗑️ Rolle löschen', options: [{ name: 'rolle', description: 'Rolle', type: ApplicationCommandOptionType.Role, required: true }] },
  { name: 'rolle_info', description: 'ℹ️ Rollen Info', options: [{ name: 'rolle', description: 'Rolle', type: ApplicationCommandOptionType.Role, required: true }] },
  { name: 'alle_rollen', description: '📋 Alle Rollen anzeigen' },

  // ===== KANÄLE =====
  { name: 'kanal_erstellen', description: '➕ Kanal erstellen', options: [{ name: 'name', description: 'Name', type: ApplicationCommandOptionType.String, required: true }, { name: 'typ', description: 'Typ', type: ApplicationCommandOptionType.String, required: true, choices: [{ name: 'Text', value: 'text' }, { name: 'Voice', value: 'voice' }, { name: 'Ankündigung', value: 'news' }] }] },
  { name: 'kanal_loeschen', description: '🗑️ Kanal löschen', options: [{ name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: true }] },
  { name: 'kanal_umbenennen', description: '✏️ Kanal umbenennen', options: [{ name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: true }, { name: 'name', description: 'Neuer Name', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'kanal_sperren', description: '🔒 Kanal sperren', options: [{ name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: false }] },
  { name: 'kanal_entsperren', description: '🔓 Kanal entsperren', options: [{ name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: false }] },
  { name: 'kanal_info', description: 'ℹ️ Kanal Info', options: [{ name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: false }] },
  { name: 'slowmode', description: '🐌 Slowmode setzen', options: [{ name: 'sekunden', description: 'Sekunden (0=aus)', type: ApplicationCommandOptionType.Integer, required: true }] },
  { name: 'kategorie_erstellen', description: '📁 Kategorie erstellen', options: [{ name: 'name', description: 'Name', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'thema_setzen', description: '📝 Kanal-Thema setzen', options: [TEXT_OPT] },
  { name: 'nsfw_toggle', description: '🔞 NSFW togglen', options: [{ name: 'kanal', description: 'Kanal', type: ApplicationCommandOptionType.Channel, required: false }] },

  // ===== NACHRICHTEN =====
  { name: 'clear', description: '🗑️ Nachricht per ID löschen', options: [{ name: 'message_id', description: 'Nachrichten-ID', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'purge', description: '🗑️ Mehrere Nachrichten löschen', options: [{ name: 'anzahl', description: 'Anzahl (1-100)', type: ApplicationCommandOptionType.Integer, required: true }] },
  { name: 'purge_user', description: '🗑️ Nachrichten eines Users löschen', options: [USER_OPT, { name: 'anzahl', description: 'Anzahl', type: ApplicationCommandOptionType.Integer, required: true }] },
  { name: 'say', description: '📢 Bot sagt etwas', options: [TEXT_OPT] },
  { name: 'embed', description: '📝 Embed senden', options: [{ name: 'titel', description: 'Titel', type: ApplicationCommandOptionType.String, required: true }, TEXT_OPT, { name: 'farbe', description: 'Farbe (hex)', type: ApplicationCommandOptionType.String, required: false }] },
  { name: 'ankuendigung', description: '📢 Ankündigung senden', options: [TEXT_OPT] },
  { name: 'pin', description: '📌 Nachricht pinnen', options: [{ name: 'message_id', description: 'Nachrichten-ID', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'unpin', description: '📌 Nachricht entpinnen', options: [{ name: 'message_id', description: 'Nachrichten-ID', type: ApplicationCommandOptionType.String, required: true }] },

  // ===== SERVER =====
  { name: 'server_info', description: 'ℹ️ Server Info' },
  { name: 'server_lock', description: '🔒 Server sperren' },
  { name: 'server_unlock', description: '🔓 Server entsperren' },
  { name: 'server_icon', description: '🖼️ Server Icon anzeigen' },
  { name: 'server_umbenennen', description: '✏️ Server umbenennen', options: [{ name: 'name', description: 'Neuer Name', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'mitglieder', description: '👥 Mitgliederzahl anzeigen' },
  { name: 'banliste', description: '📋 Banliste anzeigen' },
  { name: 'einladung', description: '🔗 Einladungslink erstellen' },
  { name: 'emojis', description: '😀 Alle Emojis anzeigen' },
  { name: 'boosts', description: '🚀 Server-Boosts anzeigen' },

  // ===== FUN =====
  { name: 'poll', description: '📊 Umfrage erstellen', options: [{ name: 'frage', description: 'Frage', type: ApplicationCommandOptionType.String, required: true }, { name: 'option1', description: 'Option 1', type: ApplicationCommandOptionType.String, required: true }, { name: 'option2', description: 'Option 2', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'coinflip', description: '🪙 Münze werfen' },
  { name: 'wuerfel', description: '🎲 Würfeln', options: [{ name: 'seiten', description: 'Anzahl Seiten', type: ApplicationCommandOptionType.Integer, required: false }] },
  { name: 'zitat', description: '💬 Zufälliges Zitat' },
  { name: 'countdown', description: '⏱️ Countdown starten', options: [{ name: 'sekunden', description: 'Sekunden', type: ApplicationCommandOptionType.Integer, required: true }] },
  { name: '8ball', description: '🎱 8-Ball Frage', options: [{ name: 'frage', description: 'Frage', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'giveaway', description: '🎉 Giveaway starten', options: [{ name: 'preis', description: 'Preis', type: ApplicationCommandOptionType.String, required: true }, { name: 'minuten', description: 'Minuten', type: ApplicationCommandOptionType.Integer, required: true }] },
  { name: 'tipp', description: '💡 Zufälliger Minecraft Tipp' },

  // ===== INFO =====
  { name: 'ip', description: '🗺️ Server IP anzeigen' },
  { name: 'raenge', description: '🏆 Alle Ränge anzeigen' },
  { name: 'help', description: '📖 Alle Befehle anzeigen' },
  { name: 'ping', description: '🏓 Bot Ping anzeigen' },
  { name: 'uptime', description: '⏱️ Bot Uptime anzeigen' },
  { name: 'bot_info', description: '🤖 Bot Info anzeigen' },

  // ===== MODERATION EXTRA =====
  { name: 'softban', description: '🔨 Softban (ban+unban)', options: [USER_OPT, GRUND_OPT] },
  { name: 'tempban', description: '⏱️ Temporärer Ban', options: [USER_OPT, { name: 'stunden', description: 'Stunden', type: ApplicationCommandOptionType.Integer, required: true }, GRUND_OPT] },
  { name: 'massban', description: '🔨 Mehrere User bannen', options: [{ name: 'ids', description: 'User IDs (kommagetrennt)', type: ApplicationCommandOptionType.String, required: true }] },
  { name: 'logs', description: '📋 Moderations-Logs anzeigen' },
  { name: 'warnungen', description: '⚠️ Warnungen eines Users anzeigen', options: [USER_OPT] },
  { name: 'warnungen_reset', description: '🔄 Warnungen zurücksetzen', options: [USER_OPT] },
];

const warnungen = new Map();
const startTime = Date.now();

client.once('ready', async () => {
  console.log(`✅ Owner-Bot online als ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN2);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log(`✅ ${commands.length} Owner-Commands registriert!`);
});

function istOwner(interaction) {
  if (interaction.user.id !== OWNER_ID) {
    interaction.reply({ content: '❌ Nur der Owner kann diesen Befehl nutzen!', ephemeral: true });
    return false;
  }
  return true;
}

const zitate = [
  '„Das Leben ist kein Minecraft, aber du kannst es trotzdem bauen." 🏗️',
  '„Creeper? Aw man." 💥',
  '„Der beste Bergmann gräbt nicht immer am tiefsten." ⛏️',
  '„Diamanten findet man nicht an der Oberfläche." 💎',
];

const mcTipps = [
  '💡 Baue dein Haus aus Stein – Creeper können es nicht zerstören!',
  '💡 Schlafe jede Nacht um Phantome zu vermeiden!',
  '💡 Verzaubere deine Rüstung mit Schutz IV!',
  '💡 Halte immer goldene Äpfel bereit!',
  '💡 Baue einen Nether-Hub für schnelles Reisen!',
];

const achtballAntworten = [
  '✅ Ja!', '✅ Definitiv!', '✅ Auf jeden Fall!',
  '❌ Nein!', '❌ Auf keinen Fall!', '❌ Eher nicht.',
  '🤔 Vielleicht...', '🤔 Frag später nochmal.', '🎱 Die Zeichen sagen Ja.',
];

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!istOwner(interaction)) return;

  const { commandName, guild, member, channel } = interaction;

  // ===== USER MANAGEMENT =====
  if (commandName === 'nick') {
    const ziel = interaction.options.getMember('user');
    const nickname = interaction.options.getString('nickname');
    await ziel.setNickname(nickname);
    return interaction.reply({ content: `✅ Nickname auf **${nickname}** geändert!`, ephemeral: true });
  }

  if (commandName === 'nick_reset') {
    const ziel = interaction.options.getMember('user');
    await ziel.setNickname(null);
    return interaction.reply({ content: `✅ Nickname zurückgesetzt!`, ephemeral: true });
  }

  if (commandName === 'rang') {
    const ziel = interaction.options.getMember('user');
    const rangNr = parseInt(interaction.options.getString('rang'));
    const neuerRang = RAENGE[rangNr - 1];
    for (const rang of RAENGE) {
      const rolle = guild.roles.cache.find(r => r.name === rang.name);
      if (rolle) await ziel.roles.remove(rolle).catch(() => {});
    }
    const neueRolle = guild.roles.cache.find(r => r.name === neuerRang.name);
    if (!neueRolle) return interaction.reply({ content: `❌ Rolle nicht gefunden!`, ephemeral: true });
    await ziel.roles.add(neueRolle);
    return interaction.reply({ content: `✅ ${ziel} hat jetzt Rang **${neuerRang.name}**!`, ephemeral: true });
  }

  if (commandName === 'rang_entfernen') {
    const ziel = interaction.options.getMember('user');
    for (const rang of RAENGE) {
      const rolle = guild.roles.cache.find(r => r.name === rang.name);
      if (rolle) await ziel.roles.remove(rolle).catch(() => {});
    }
    return interaction.reply({ content: `✅ Alle Ränge von ${ziel} entfernt!`, ephemeral: true });
  }

  if (commandName === 'kick') {
    const ziel = interaction.options.getMember('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund';
    await ziel.kick(grund);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** gekickt!`, ephemeral: true });
  }

  if (commandName === 'ban') {
    const ziel = interaction.options.getMember('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund';
    await ziel.ban({ reason: grund });
    return interaction.reply({ content: `✅ **${ziel.user.tag}** gebannt!`, ephemeral: true });
  }

  if (commandName === 'unban') {
    const userId = interaction.options.getString('user_id');
    await guild.members.unban(userId);
    return interaction.reply({ content: `✅ User entbannt!`, ephemeral: true });
  }

  if (commandName === 'mute') {
    const ziel = interaction.options.getMember('user');
    const minuten = interaction.options.getInteger('minuten') || 10;
    await ziel.timeout(minuten * 60 * 1000);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** für ${minuten} Min stummgeschaltet!`, ephemeral: true });
  }

  if (commandName === 'unmute') {
    const ziel = interaction.options.getMember('user');
    await ziel.timeout(null);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** entstummt!`, ephemeral: true });
  }

  if (commandName === 'warn') {
    const ziel = interaction.options.getMember('user');
    const text = interaction.options.getString('text');
    if (!warnungen.has(ziel.id)) warnungen.set(ziel.id, []);
    warnungen.get(ziel.id).push(text);
    await ziel.send(`⚠️ Du wurdest auf **${guild.name}** verwarnt!\nGrund: **${text}**`).catch(() => {});
    return interaction.reply({ content: `✅ ${ziel} verwarnt! (${warnungen.get(ziel.id).length} Verwarnungen)`, ephemeral: true });
  }

  if (commandName === 'warnungen') {
    const ziel = interaction.options.getMember('user');
    const liste = warnungen.get(ziel.id) || [];
    return interaction.reply({ content: `⚠️ **${ziel.user.tag}** hat ${liste.length} Verwarnungen:\n${liste.map((w, i) => `${i + 1}. ${w}`).join('\n') || 'Keine'}`, ephemeral: true });
  }

  if (commandName === 'warnungen_reset') {
    const ziel = interaction.options.getMember('user');
    warnungen.delete(ziel.id);
    return interaction.reply({ content: `✅ Warnungen von ${ziel} zurückgesetzt!`, ephemeral: true });
  }

  if (commandName === 'user_info') {
    const ziel = interaction.options.getMember('user') || member;
    const embed = new EmbedBuilder()
      .setColor('#00CED1')
      .setTitle(`ℹ️ ${ziel.user.tag}`)
      .setThumbnail(ziel.user.displayAvatarURL())
      .addFields(
        { name: '🆔 ID', value: ziel.user.id, inline: true },
        { name: '📅 Beigetreten', value: `<t:${Math.floor(ziel.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: '⚠️ Warnungen', value: String(warnungen.get(ziel.id)?.length || 0), inline: true },
        { name: '🎭 Rollen', value: ziel.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Keine' },
      ).setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'avatar') {
    const ziel = interaction.options.getMember('user') || member;
    const embed = new EmbedBuilder().setTitle(`🖼️ ${ziel.user.tag}`).setImage(ziel.user.displayAvatarURL({ size: 1024 })).setColor('#FFD700');
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'dm') {
    const ziel = interaction.options.getMember('user');
    const text = interaction.options.getString('text');
    await ziel.send(text).catch(() => {});
    return interaction.reply({ content: `✅ DM an ${ziel} gesendet!`, ephemeral: true });
  }

  if (commandName === 'voice_kick') {
    const ziel = interaction.options.getMember('user');
    await ziel.voice.disconnect();
    return interaction.reply({ content: `✅ ${ziel} aus Voice gekickt!`, ephemeral: true });
  }

  if (commandName === 'voice_move') {
    const ziel = interaction.options.getMember('user');
    const kanal = interaction.options.getChannel('kanal');
    await ziel.voice.setChannel(kanal);
    return interaction.reply({ content: `✅ ${ziel} in **${kanal.name}** verschoben!`, ephemeral: true });
  }

  if (commandName === 'voice_mute') {
    const ziel = interaction.options.getMember('user');
    await ziel.voice.setMute(true);
    return interaction.reply({ content: `✅ ${ziel} in Voice stummgeschaltet!`, ephemeral: true });
  }

  if (commandName === 'voice_unmute') {
    const ziel = interaction.options.getMember('user');
    await ziel.voice.setMute(false);
    return interaction.reply({ content: `✅ ${ziel} in Voice entstummt!`, ephemeral: true });
  }

  if (commandName === 'voice_deafen') {
    const ziel = interaction.options.getMember('user');
    await ziel.voice.setDeaf(true);
    return interaction.reply({ content: `✅ ${ziel} taubgeschaltet!`, ephemeral: true });
  }

  if (commandName === 'voice_undeafen') {
    const ziel = interaction.options.getMember('user');
    await ziel.voice.setDeaf(false);
    return interaction.reply({ content: `✅ ${ziel} entstaubschaltet!`, ephemeral: true });
  }

  // ===== ROLLEN =====
  if (commandName === 'rolle_geben') {
    const ziel = interaction.options.getMember('user');
    const rolle = interaction.options.getRole('rolle');
    await ziel.roles.add(rolle);
    return interaction.reply({ content: `✅ ${ziel} hat jetzt **${rolle.name}**!`, ephemeral: true });
  }

  if (commandName === 'rolle_entfernen') {
    const ziel = interaction.options.getMember('user');
    const rolle = interaction.options.getRole('rolle');
    await ziel.roles.remove(rolle);
    return interaction.reply({ content: `✅ Rolle **${rolle.name}** entfernt!`, ephemeral: true });
  }

  if (commandName === 'rolle_erstellen') {
    const name = interaction.options.getString('name');
    const farbe = interaction.options.getString('farbe') || '#99AAB5';
    await guild.roles.create({ name, color: farbe });
    return interaction.reply({ content: `✅ Rolle **${name}** erstellt!`, ephemeral: true });
  }

  if (commandName === 'rolle_loeschen') {
    const rolle = interaction.options.getRole('rolle');
    await rolle.delete();
    return interaction.reply({ content: `✅ Rolle gelöscht!`, ephemeral: true });
  }

  if (commandName === 'rolle_info') {
    const rolle = interaction.options.getRole('rolle');
    const embed = new EmbedBuilder()
      .setColor(rolle.color)
      .setTitle(`🎭 ${rolle.name}`)
      .addFields(
        { name: '🆔 ID', value: rolle.id, inline: true },
        { name: '👥 Mitglieder', value: String(rolle.members.size), inline: true },
        { name: '🎨 Farbe', value: rolle.hexColor, inline: true },
        { name: '⚙️ Admin', value: rolle.permissions.has(PermissionsBitField.Flags.Administrator) ? '✅' : '❌', inline: true },
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'alle_rollen') {
    const liste = guild.roles.cache.filter(r => r.name !== '@everyone').map(r => `${r.name}`).join('\n');
    return interaction.reply({ content: `📋 **Alle Rollen:**\n${liste}`, ephemeral: true });
  }

  // ===== KANÄLE =====
  if (commandName === 'kanal_erstellen') {
    const name = interaction.options.getString('name');
    const typ = interaction.options.getString('typ');
    const typeMap = { text: ChannelType.GuildText, voice: ChannelType.GuildVoice, news: ChannelType.GuildAnnouncement };
    await guild.channels.create({ name, type: typeMap[typ] });
    return interaction.reply({ content: `✅ Kanal **${name}** erstellt!`, ephemeral: true });
  }

  if (commandName === 'kanal_loeschen') {
    const kanal = interaction.options.getChannel('kanal');
    await kanal.delete();
    return interaction.reply({ content: `✅ Kanal gelöscht!`, ephemeral: true });
  }

  if (commandName === 'kanal_umbenennen') {
    const kanal = interaction.options.getChannel('kanal');
    const name = interaction.options.getString('name');
    await kanal.setName(name);
    return interaction.reply({ content: `✅ Kanal umbenannt zu **${name}**!`, ephemeral: true });
  }

  if (commandName === 'kanal_sperren') {
    const kanal = interaction.options.getChannel('kanal') || channel;
    await kanal.permissionOverwrites.edit(guild.id, { SendMessages: false });
    return interaction.reply({ content: `🔒 Kanal gesperrt!`, ephemeral: true });
  }

  if (commandName === 'kanal_entsperren') {
    const kanal = interaction.options.getChannel('kanal') || channel;
    await kanal.permissionOverwrites.edit(guild.id, { SendMessages: true });
    return interaction.reply({ content: `🔓 Kanal entsperrt!`, ephemeral: true });
  }

  if (commandName === 'kanal_info') {
    const kanal = interaction.options.getChannel('kanal') || channel;
    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle(`ℹ️ #${kanal.name}`)
      .addFields(
        { name: '🆔 ID', value: kanal.id, inline: true },
        { name: '📁 Kategorie', value: kanal.parent?.name || 'Keine', inline: true },
        { name: '📅 Erstellt', value: `<t:${Math.floor(kanal.createdTimestamp / 1000)}:D>`, inline: true },
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'slowmode') {
    const sekunden = interaction.options.getInteger('sekunden');
    await channel.setRateLimitPerUser(sekunden);
    return interaction.reply({ content: `✅ Slowmode: **${sekunden}s**!`, ephemeral: true });
  }

  if (commandName === 'kategorie_erstellen') {
    const name = interaction.options.getString('name');
    await guild.channels.create({ name, type: ChannelType.GuildCategory });
    return interaction.reply({ content: `✅ Kategorie **${name}** erstellt!`, ephemeral: true });
  }

  if (commandName === 'thema_setzen') {
    const text = interaction.options.getString('text');
    await channel.setTopic(text);
    return interaction.reply({ content: `✅ Thema gesetzt!`, ephemeral: true });
  }

  if (commandName === 'nsfw_toggle') {
    const kanal = interaction.options.getChannel('kanal') || channel;
    await kanal.setNSFW(!kanal.nsfw);
    return interaction.reply({ content: `✅ NSFW: **${!kanal.nsfw ? 'AN' : 'AUS'}**!`, ephemeral: true });
  }

  // ===== NACHRICHTEN =====
  if (commandName === 'clear') {
    const messageId = interaction.options.getString('message_id');
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return interaction.reply({ content: '❌ Nachricht nicht gefunden!', ephemeral: true });
    await msg.delete();
    return interaction.reply({ content: '✅ Nachricht gelöscht!', ephemeral: true });
  }

  if (commandName === 'purge') {
    const anzahl = interaction.options.getInteger('anzahl');
    await channel.bulkDelete(anzahl, true);
    return interaction.reply({ content: `✅ **${anzahl}** Nachrichten gelöscht!`, ephemeral: true });
  }

  if (commandName === 'purge_user') {
    const ziel = interaction.options.getMember('user');
    const anzahl = interaction.options.getInteger('anzahl');
    const msgs = await channel.messages.fetch({ limit: 100 });
    const userMsgs = msgs.filter(m => m.author.id === ziel.id).first(anzahl);
    await channel.bulkDelete(userMsgs, true);
    return interaction.reply({ content: `✅ **${userMsgs.size}** Nachrichten von ${ziel} gelöscht!`, ephemeral: true });
  }

  if (commandName === 'say') {
    await channel.send(interaction.options.getString('text'));
    return interaction.reply({ content: '✅ Gesendet!', ephemeral: true });
  }

  if (commandName === 'embed') {
    const embed = new EmbedBuilder()
      .setTitle(interaction.options.getString('titel'))
      .setDescription(interaction.options.getString('text'))
      .setColor(interaction.options.getString('farbe') || '#FFD700')
      .setTimestamp();
    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed gesendet!', ephemeral: true });
  }

  if (commandName === 'ankuendigung') {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('📢 Ankündigung')
      .setDescription(interaction.options.getString('text'))
      .setFooter({ text: `von ${interaction.user.tag}` })
      .setTimestamp();
    await channel.send({ content: '@everyone', embeds: [embed] });
    return interaction.reply({ content: '✅ Ankündigung gesendet!', ephemeral: true });
  }

  if (commandName === 'pin') {
    const msg = await channel.messages.fetch(interaction.options.getString('message_id')).catch(() => null);
    if (!msg) return interaction.reply({ content: '❌ Nicht gefunden!', ephemeral: true });
    await msg.pin();
    return interaction.reply({ content: '✅ Nachricht gepinnt!', ephemeral: true });
  }

  if (commandName === 'unpin') {
    const msg = await channel.messages.fetch(interaction.options.getString('message_id')).catch(() => null);
    if (!msg) return interaction.reply({ content: '❌ Nicht gefunden!', ephemeral: true });
    await msg.unpin();
    return interaction.reply({ content: '✅ Nachricht entpinnt!', ephemeral: true });
  }

  // ===== SERVER =====
  if (commandName === 'server_info') {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`ℹ️ ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Mitglieder', value: String(guild.memberCount), inline: true },
        { name: '💬 Kanäle', value: String(guild.channels.cache.size), inline: true },
        { name: '🎭 Rollen', value: String(guild.roles.cache.size), inline: true },
        { name: '😀 Emojis', value: String(guild.emojis.cache.size), inline: true },
        { name: '🚀 Boosts', value: String(guild.premiumSubscriptionCount), inline: true },
        { name: '📅 Erstellt', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
      ).setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'server_lock') {
    for (const [, kanal] of guild.channels.cache.filter(c => c.type === ChannelType.GuildText)) {
      await kanal.permissionOverwrites.edit(guild.id, { SendMessages: false }).catch(() => {});
    }
    return interaction.reply({ content: '🔒 Server gesperrt!', ephemeral: true });
  }

  if (commandName === 'server_unlock') {
    for (const [, kanal] of guild.channels.cache.filter(c => c.type === ChannelType.GuildText)) {
      await kanal.permissionOverwrites.edit(guild.id, { SendMessages: true }).catch(() => {});
    }
    return interaction.reply({ content: '🔓 Server entsperrt!', ephemeral: true });
  }

  if (commandName === 'server_icon') {
    const embed = new EmbedBuilder().setTitle(`🖼️ ${guild.name}`).setImage(guild.iconURL({ size: 1024 })).setColor('#FFD700');
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'server_umbenennen') {
    const name = interaction.options.getString('name');
    await guild.setName(name);
    return interaction.reply({ content: `✅ Server umbenannt zu **${name}**!`, ephemeral: true });
  }

  if (commandName === 'mitglieder') {
    return interaction.reply({ content: `👥 Der Server hat **${guild.memberCount}** Mitglieder!`, ephemeral: true });
  }

  if (commandName === 'banliste') {
    const bans = await guild.bans.fetch();
    const liste = bans.map(b => `**${b.user.tag}** – ${b.reason || 'Kein Grund'}`).join('\n') || 'Keine Bans';
    return interaction.reply({ content: `📋 **Banliste:**\n${liste}`, ephemeral: true });
  }

  if (commandName === 'einladung') {
    const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
    return interaction.reply({ content: `🔗 **Einladungslink:** ${invite.url}`, ephemeral: true });
  }

  if (commandName === 'emojis') {
    const liste = guild.emojis.cache.map(e => `${e}`).join(' ') || 'Keine Emojis';
    return interaction.reply({ content: `😀 **Emojis:**\n${liste}`, ephemeral: true });
  }

  if (commandName === 'boosts') {
    return interaction.reply({ content: `🚀 **${guild.premiumSubscriptionCount}** Boosts – Level **${guild.premiumTier}**`, ephemeral: true });
  }

  // ===== FUN =====
  if (commandName === 'poll') {
    const frage = interaction.options.getString('frage');
    const opt1 = interaction.options.getString('option1');
    const opt2 = interaction.options.getString('option2');
    const embed = new EmbedBuilder().setColor('#9B59B6').setTitle(`📊 ${frage}`).setDescription(`👍 ${opt1}\n👎 ${opt2}`).setTimestamp();
    const msg = await channel.send({ embeds: [embed] });
    await msg.react('👍');
    await msg.react('👎');
    return interaction.reply({ content: '✅ Umfrage gestartet!', ephemeral: true });
  }

  if (commandName === 'coinflip') {
    const result = Math.random() < 0.5 ? '👍 Kopf!' : '👎 Zahl!';
    return interaction.reply({ content: `🪙 ${result}`, ephemeral: true });
  }

  if (commandName === 'wuerfel') {
    const seiten = interaction.options.getInteger('seiten') || 6;
    const result = Math.floor(Math.random() * seiten) + 1;
    return interaction.reply({ content: `🎲 Du hast eine **${result}** gewürfelt! (W${seiten})`, ephemeral: true });
  }

  if (commandName === 'zitat') {
    return interaction.reply({ content: zitate[Math.floor(Math.random() * zitate.length)], ephemeral: true });
  }

  if (commandName === '8ball') {
    const antwort = achtballAntworten[Math.floor(Math.random() * achtballAntworten.length)];
    return interaction.reply({ content: `🎱 **${antwort}**`, ephemeral: true });
  }

  if (commandName === 'tipp') {
    return interaction.reply({ content: mcTipps[Math.floor(Math.random() * mcTipps.length)], ephemeral: true });
  }

  if (commandName === 'giveaway') {
    const preis = interaction.options.getString('preis');
    const minuten = interaction.options.getInteger('minuten');
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎉 GIVEAWAY!')
      .setDescription(`**Preis:** ${preis}\n**Dauer:** ${minuten} Minuten\n\nReagiere mit 🎉 um teilzunehmen!`)
      .setFooter({ text: `Endet in ${minuten} Minuten` })
      .setTimestamp(Date.now() + minuten * 60 * 1000);
    const msg = await channel.send({ embeds: [embed] });
    await msg.react('🎉');
    setTimeout(async () => {
      const reaction = msg.reactions.cache.get('🎉');
      const users = await reaction.users.fetch();
      const teilnehmer = users.filter(u => !u.bot);
      if (teilnehmer.size === 0) {
        await channel.send('❌ Kein Gewinner – niemand hat teilgenommen!');
      } else {
        const gewinner = teilnehmer.random();
        await channel.send(`🎉 Herzlichen Glückwunsch ${gewinner}! Du hast **${preis}** gewonnen!`);
      }
    }, minuten * 60 * 1000);
    return interaction.reply({ content: '✅ Giveaway gestartet!', ephemeral: true });
  }

  if (commandName === 'countdown') {
    const sekunden = interaction.options.getInteger('sekunden');
    await interaction.reply({ content: `⏱️ Countdown: **${sekunden}** Sekunden!` });
    for (let i = sekunden; i > 0; i--) {
      await new Promise(r => setTimeout(r, 1000));
      if (i <= 5) await channel.send(`⏱️ **${i}**`);
    }
    await channel.send('🚀 **Zeit ist um!**');
  }

  // ===== INFO =====
  if (commandName === 'ip') {
    return interaction.reply({ content: '🗺️ **Server IP:** `deine.server.ip`\n**Port:** `25565`', ephemeral: true });
  }

  if (commandName === 'raenge') {
    const liste = RAENGE.map((r, i) => `**${i + 1}.** ${r.name}`).join('\n');
    return interaction.reply({ content: `🏆 **Alle Ränge:**\n${liste}`, ephemeral: true });
  }

  if (commandName === 'ping') {
    return interaction.reply({ content: `🏓 Pong! **${client.ws.ping}ms**`, ephemeral: true });
  }

  if (commandName === 'uptime') {
    const ms = Date.now() - startTime;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return interaction.reply({ content: `⏱️ Uptime: **${h}h ${m}m ${s}s**`, ephemeral: true });
  }

  if (commandName === 'bot_info') {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🤖 Owner Bot Info')
      .addFields(
        { name: '👑 Owner', value: OWNER_NAME, inline: true },
        { name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
        { name: '📋 Befehle', value: String(commands.length), inline: true },
        { name: '⏱️ Uptime', value: `${Math.floor((Date.now() - startTime) / 60000)} Minuten`, inline: true },
      ).setTimestamp();
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('📖 Owner Bot Befehle')
      .addFields(
        { name: '👤 User', value: '/nick /rang /kick /ban /unban /mute /unmute /warn /dm /avatar /user_info' },
        { name: '🎙️ Voice', value: '/voice_kick /voice_move /voice_mute /voice_unmute /voice_deafen' },
        { name: '🎭 Rollen', value: '/rolle_geben /rolle_entfernen /rolle_erstellen /rolle_loeschen /rolle_info' },
        { name: '💬 Kanäle', value: '/kanal_erstellen /kanal_loeschen /kanal_umbenennen /kanal_sperren /slowmode' },
        { name: '📝 Nachrichten', value: '/clear /purge /purge_user /say /embed /ankuendigung /pin /unpin' },
        { name: '🏰 Server', value: '/server_info /server_lock /server_unlock /server_umbenennen /banliste /einladung' },
        { name: '🎮 Fun', value: '/poll /coinflip /wuerfel /zitat /8ball /giveaway /countdown /tipp' },
        { name: 'ℹ️ Info', value: '/ping /uptime /bot_info /ip /raenge' },
      )
      .setFooter({ text: `${commands.length} Befehle total – Nur für ${OWNER_NAME}` });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ===== MODERATION EXTRA =====
  if (commandName === 'softban') {
    const ziel = interaction.options.getMember('user');
    const grund = interaction.options.getString('grund') || 'Softban';
    await ziel.ban({ reason: grund, deleteMessageDays: 1 });
    await guild.members.unban(ziel.id);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** softgebannt!`, ephemeral: true });
  }

  if (commandName === 'tempban') {
    const ziel = interaction.options.getMember('user');
    const stunden = interaction.options.getInteger('stunden');
    const grund = interaction.options.getString('grund') || 'Temporärer Ban';
    await ziel.ban({ reason: grund });
    setTimeout(async () => {
      await guild.members.unban(ziel.id).catch(() => {});
    }, stunden * 3600000);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** für ${stunden} Stunden gebannt!`, ephemeral: true });
  }

  if (commandName === 'massban') {
    const ids = interaction.options.getString('ids').split(',').map(id => id.trim());
    for (const id of ids) {
      await guild.members.ban(id).catch(() => {});
    }
    return interaction.reply({ content: `✅ **${ids.length}** User gebannt!`, ephemeral: true });
  }

  if (commandName === 'logs') {
    return interaction.reply({ content: '📋 Logs-System kommt bald!', ephemeral: true });
  }
});

client.login(process.env.TOKEN2);
