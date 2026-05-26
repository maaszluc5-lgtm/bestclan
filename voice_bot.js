const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ChannelType, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ]
});

// Speichert alle erstellten Voice-Kanäle: { kanalId: { ownerId, banned: [] } }
const voiceKanäle = new Map();

// ===== SLASH COMMANDS REGISTRIEREN =====
const commands = [
  { name: 'voice_create', description: '🎙️ Erstellt deinen privaten Voice-Kanal' },
  { name: 'voice_delete', description: '🗑️ Löscht deinen Voice-Kanal' },
  { name: 'voice_lock', description: '🔒 Sperrt deinen Kanal' },
  { name: 'voice_unlock', description: '🔓 Öffnet deinen Kanal' },
  { name: 'voice_hide', description: '🙈 Macht deinen Kanal unsichtbar' },
  { name: 'voice_show', description: '👁️ Macht deinen Kanal sichtbar' },
  { name: 'voice_reset', description: '🔄 Setzt alle Einstellungen zurück' },
  { name: 'voice_info', description: 'ℹ️ Zeigt Infos über deinen Kanal' },
  { name: 'voice_list', description: '📋 Zeigt alle aktiven Voice-Kanäle' },
  {
    name: 'voice_kick',
    description: '👢 Wirft einen User aus deinem Kanal',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_ban',
    description: '🚫 Sperrt einen User dauerhaft aus deinem Kanal',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_unban',
    description: '✅ Entsperrt einen User',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_invite',
    description: '💌 Lädt einen User in deinen Kanal ein',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_mute',
    description: '🔇 Schaltet einen User stumm',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_unmute',
    description: '🔊 Entstummt einen User',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_owner',
    description: '👑 Überträgt den Besitz des Kanals',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_transfer',
    description: '🔁 Übergibt deinen Kanal an jemanden',
    options: [{ name: 'user', description: 'User auswählen', type: 6, required: true }]
  },
  {
    name: 'voice_limit',
    description: '👥 Setzt die maximale Personenanzahl',
    options: [{ name: 'zahl', description: 'Max. Personen (0 = unbegrenzt)', type: 4, required: true }]
  },
  {
    name: 'voice_name',
    description: '✏️ Benennt deinen Kanal um',
    options: [{ name: 'name', description: 'Neuer Kanalname', type: 3, required: true }]
  },
  {
    name: 'voice_bitrate',
    description: '🎵 Ändert die Audioqualität',
    options: [{ name: 'kbps', description: 'Bitrate in kbps (z.B. 64, 96, 128)', type: 4, required: true }]
  },
];

// ===== HILFSFUNKTIONEN =====
function getVoiceKanal(interaction) {
  for (const [kanalId, data] of voiceKanäle.entries()) {
    if (data.ownerId === interaction.user.id) {
      const kanal = interaction.guild.channels.cache.get(kanalId);
      if (kanal) return { kanal, data };
    }
  }
  return null;
}

function istStaff(member) {
  return member.roles.cache.some(r =>
    ['🛡️ Moderator', '⚙️ Admin', '👑 Legendär', '💎 Ultra', '🔱 Supreme'].includes(r.name)
  );
}

function istSupporter(member) {
  return member.roles.cache.some(r => r.name === '💙 Supporter') || istStaff(member);
}

// ===== BOT BEREIT =====
client.once('ready', async () => {
  console.log(`✅ Voice-Bot online als ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Slash-Commands registriert!');
  } catch (e) {
    console.error(e);
  }
});

// ===== AUTO "JOIN TO CREATE" =====
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Jemand betritt "sprachkanäle-erstellen"
  if (newState.channel?.name === 'sprachkanäle-erstellen') {
    const kanal = await newState.guild.channels.create({
      name: `🎙️ ${newState.member.displayName}`,
      type: ChannelType.GuildVoice,
      parent: newState.channel.parent,
      permissionOverwrites: [
        {
          id: newState.guild.id,
          allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: newState.member.id,
          allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.MoveMembers],
        },
      ],
    });
    voiceKanäle.set(kanal.id, { ownerId: newState.member.id, banned: [] });
    await newState.member.voice.setChannel(kanal);
  }

  // Kanal löschen wenn leer
  if (oldState.channel && voiceKanäle.has(oldState.channel.id)) {
    if (oldState.channel.members.size === 0) {
      await oldState.channel.delete().catch(() => {});
      voiceKanäle.delete(oldState.channel.id);
    }
  }
});

// ===== SLASH COMMAND HANDLER =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, member, guild } = interaction;

  // Supporter & Mod Rolle für Berechtigungsprüfung
  const kannImmerBeitreten = istSupporter(member);

  // --- /voice_create ---
  if (commandName === 'voice_create') {
    if (!member.voice.channel) return interaction.reply({ content: '❌ Du musst in einem Voice-Kanal sein!', ephemeral: true });
    return interaction.reply({ content: '✅ Dein Kanal wurde automatisch erstellt! Tritt dem **sprachkanäle-erstellen** bei.', ephemeral: true });
  }

  // --- /voice_list ---
  if (commandName === 'voice_list') {
    if (voiceKanäle.size === 0) return interaction.reply({ content: '📋 Keine aktiven Voice-Kanäle.', ephemeral: true });
    const liste = [...voiceKanäle.entries()].map(([id, data]) => {
      const kanal = guild.channels.cache.get(id);
      const owner = guild.members.cache.get(data.ownerId);
      return kanal ? `🎙️ **${kanal.name}** – Besitzer: ${owner?.displayName || 'Unbekannt'} (${kanal.members.size} Personen)` : null;
    }).filter(Boolean).join('\n');
    const embed = new EmbedBuilder().setColor('#00CED1').setTitle('📋 Aktive Voice-Kanäle').setDescription(liste);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Ab hier: User muss einen eigenen Kanal haben
  const result = getVoiceKanal(interaction);

  if (commandName === 'voice_info') {
    if (!result) return interaction.reply({ content: '❌ Du hast keinen aktiven Voice-Kanal!', ephemeral: true });
    const { kanal, data } = result;
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`ℹ️ ${kanal.name}`)
      .addFields(
        { name: 'Besitzer', value: `<@${data.ownerId}>`, inline: true },
        { name: 'Personen', value: `${kanal.members.size}/${kanal.userLimit || '∞'}`, inline: true },
        { name: 'Bitrate', value: `${kanal.bitrate / 1000}kbps`, inline: true },
        { name: 'Gesperrt', value: data.locked ? '🔒 Ja' : '🔓 Nein', inline: true },
        { name: 'Sichtbar', value: data.hidden ? '🙈 Nein' : '👁️ Ja', inline: true },
        { name: 'Gebannte User', value: data.banned.length > 0 ? data.banned.map(id => `<@${id}>`).join(', ') : 'Keine', inline: false },
      );
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (!result) return interaction.reply({ content: '❌ Du hast keinen aktiven Voice-Kanal! Tritt erst **sprachkanäle-erstellen** bei.', ephemeral: true });
  const { kanal, data } = result;

  // --- /voice_delete ---
  if (commandName === 'voice_delete') {
    await kanal.delete();
    voiceKanäle.delete(kanal.id);
    return interaction.reply({ content: '✅ Kanal gelöscht!', ephemeral: true });
  }

  // --- /voice_lock ---
  if (commandName === 'voice_lock') {
    await kanal.permissionOverwrites.edit(guild.id, { Connect: false });
    // Supporter & Mod können immer beitreten
    const supporterRolle = guild.roles.cache.find(r => r.name === '💙 Supporter');
    const modRolle = guild.roles.cache.find(r => r.name === '🛡️ Moderator');
    if (supporterRolle) await kanal.permissionOverwrites.edit(supporterRolle, { Connect: true });
    if (modRolle) await kanal.permissionOverwrites.edit(modRolle, { Connect: true });
    data.locked = true;
    return interaction.reply({ content: '🔒 Kanal gesperrt! Supporter & Moderatoren können trotzdem beitreten.', ephemeral: true });
  }

  // --- /voice_unlock ---
  if (commandName === 'voice_unlock') {
    await kanal.permissionOverwrites.edit(guild.id, { Connect: true });
    data.locked = false;
    return interaction.reply({ content: '🔓 Kanal geöffnet!', ephemeral: true });
  }

  // --- /voice_hide ---
  if (commandName === 'voice_hide') {
    await kanal.permissionOverwrites.edit(guild.id, { ViewChannel: false });
    data.hidden = true;
    return interaction.reply({ content: '🙈 Kanal versteckt!', ephemeral: true });
  }

  // --- /voice_show ---
  if (commandName === 'voice_show') {
    await kanal.permissionOverwrites.edit(guild.id, { ViewChannel: true });
    data.hidden = false;
    return interaction.reply({ content: '👁️ Kanal sichtbar!', ephemeral: true });
  }

  // --- /voice_name ---
  if (commandName === 'voice_name') {
    const name = interaction.options.getString('name');
    await kanal.setName(`🎙️ ${name}`);
    return interaction.reply({ content: `✅ Kanal umbenannt zu **🎙️ ${name}**!`, ephemeral: true });
  }

  // --- /voice_limit ---
  if (commandName === 'voice_limit') {
    const zahl = interaction.options.getInteger('zahl');
    await kanal.setUserLimit(zahl);
    return interaction.reply({ content: `✅ Limit auf **${zahl === 0 ? '∞' : zahl}** gesetzt!`, ephemeral: true });
  }

  // --- /voice_bitrate ---
  if (commandName === 'voice_bitrate') {
    const kbps = Math.min(Math.max(interaction.options.getInteger('kbps'), 8), 128);
    await kanal.setBitrate(kbps * 1000);
    return interaction.reply({ content: `✅ Bitrate auf **${kbps}kbps** gesetzt!`, ephemeral: true });
  }

  // --- /voice_reset ---
  if (commandName === 'voice_reset') {
    await kanal.setName(`🎙️ ${member.displayName}`);
    await kanal.setUserLimit(0);
    await kanal.setBitrate(64000);
    await kanal.permissionOverwrites.set([
      { id: guild.id, allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel] },
      { id: member.id, allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.Connect] },
    ]);
    data.locked = false;
    data.hidden = false;
    data.banned = [];
    return interaction.reply({ content: '🔄 Alle Einstellungen zurückgesetzt!', ephemeral: true });
  }

  // Ab hier: Ziel-User nötig
  const ziel = interaction.options.getMember('user');
  if (!ziel) return interaction.reply({ content: '❌ User nicht gefunden!', ephemeral: true });

  // --- /voice_kick ---
  if (commandName === 'voice_kick') {
    if (!ziel.voice.channel) return interaction.reply({ content: '❌ Der User ist in keinem Voice-Kanal!', ephemeral: true });
    await ziel.voice.disconnect();
    return interaction.reply({ content: `✅ **${ziel.displayName}** wurde aus dem Kanal geworfen!`, ephemeral: true });
  }

  // --- /voice_ban ---
  if (commandName === 'voice_ban') {
    data.banned.push(ziel.id);
    await kanal.permissionOverwrites.edit(ziel, { Connect: false });
    if (ziel.voice.channelId === kanal.id) await ziel.voice.disconnect();
    return interaction.reply({ content: `🚫 **${ziel.displayName}** wurde aus deinem Kanal gebannt!`, ephemeral: true });
  }

  // --- /voice_unban ---
  if (commandName === 'voice_unban') {
    data.banned = data.banned.filter(id => id !== ziel.id);
    await kanal.permissionOverwrites.delete(ziel);
    return interaction.reply({ content: `✅ **${ziel.displayName}** wurde entsperrt!`, ephemeral: true });
  }

  // --- /voice_invite ---
  if (commandName === 'voice_invite') {
    await kanal.permissionOverwrites.edit(ziel, { Connect: true });
    await ziel.send(`💌 Du wurdest von **${member.displayName}** in den Voice-Kanal **${kanal.name}** eingeladen!`).catch(() => {});
    return interaction.reply({ content: `✅ **${ziel.displayName}** wurde eingeladen!`, ephemeral: true });
  }

  // --- /voice_mute ---
  if (commandName === 'voice_mute') {
    await ziel.voice.setMute(true);
    return interaction.reply({ content: `🔇 **${ziel.displayName}** wurde stummgeschaltet!`, ephemeral: true });
  }

  // --- /voice_unmute ---
  if (commandName === 'voice_unmute') {
    await ziel.voice.setMute(false);
    return interaction.reply({ content: `🔊 **${ziel.displayName}** wurde entstummt!`, ephemeral: true });
  }

  // --- /voice_owner & /voice_transfer ---
  if (commandName === 'voice_owner' || commandName === 'voice_transfer') {
    voiceKanäle.set(kanal.id, { ...data, ownerId: ziel.id });
    await kanal.permissionOverwrites.edit(ziel, { ManageChannels: true, Connect: true, MoveMembers: true });
    await kanal.permissionOverwrites.edit(member, { ManageChannels: false });
    return interaction.reply({ content: `✅ **${ziel.displayName}** ist jetzt der neue Kanal-Besitzer!`, ephemeral: true });
  }
});

client.login(process.env.TOKEN);
