const {
  Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder,
  REST, Routes, ApplicationCommandOptionType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const BEFEHLE_KANAL = 'befehle';
const SERVER_IP = 'deine.server.ip'; // <- Deine Minecraft IP eintragen

const RAENGE = [
  { name: '🎮 Spieler',        farbe: '#808080' },
  { name: '💙 Supporter',      farbe: '#1ABC9C' },
  { name: '🎨 Content',        farbe: '#9B59B6' },
  { name: '🛡️ Moderator',      farbe: '#0000FF' },
  { name: '⚙️ Admin',          farbe: '#FF0000' },
  { name: '👴 OG',             farbe: '#FF8C00' },
  { name: '🪙 Platin',         farbe: '#C0C0C0' },
  { name: '🔱 Supreme',        farbe: '#8B0000' },
  { name: '💎 Ultra',          farbe: '#00FFFF' },
  { name: '👑 Legendär',       farbe: '#FFD700' },
];

client.once('ready', async () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: [
      {
        name: 'rang',
        description: '🏆 Gibt einem User einen Rang',
        options: [
          { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: true },
          { name: 'rang', description: 'Rang auswählen', type: ApplicationCommandOptionType.String, required: true,
            choices: RAENGE.map((r, i) => ({ name: r.name, value: String(i + 1) })) }
        ]
      },
      {
        name: 'kick',
        description: '👢 Kickt einen User',
        options: [
          { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: true },
          { name: 'grund', description: 'Grund', type: ApplicationCommandOptionType.String, required: false }
        ]
      },
      {
        name: 'ban',
        description: '🔨 Bannt einen User',
        options: [
          { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: true },
          { name: 'grund', description: 'Grund', type: ApplicationCommandOptionType.String, required: false }
        ]
      },
      {
        name: 'mute',
        description: '🔇 Schaltet einen User stumm (10 Min)',
        options: [
          { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: true }
        ]
      },
      {
        name: 'unmute',
        description: '🔊 Entstummt einen User',
        options: [
          { name: 'user', description: 'User auswählen', type: ApplicationCommandOptionType.User, required: true }
        ]
      },
      {
        name: 'clear',
        description: '🗑️ Löscht Nachrichten',
        options: [
          { name: 'message_id', description: 'ID der Nachricht die gelöscht werden soll', type: ApplicationCommandOptionType.String, required: true }
        ]
      },
      { name: 'ip',    description: '🗺️ Zeigt die Minecraft Server-IP' },
      { name: 'ränge', description: '🏆 Zeigt alle Ränge' },
      { name: 'help',  description: '📖 Zeigt alle Befehle' },
    ]
  });
  console.log('✅ Slash-Commands registriert!');
});

// ===== WILLKOMMENSNACHRICHT =====
client.on('guildMemberAdd', async (member) => {
  const kanal = member.guild.channels.cache.find(c => c.name === 'willkommen');
  if (!kanal) return;

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚔️ Willkommen auf dem Server!')
    .setDescription(`Hey ${member}! Willkommen auf unserem Minecraft-Server! 🎮\n\nLies dir die **#regeln** durch und viel Spaß!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `Mitglied #${member.guild.memberCount}` })
    .setTimestamp();

  kanal.send({ embeds: [embed] });

  const neulingRolle = member.guild.roles.cache.find(r => r.name === '🎮 Spieler');
  if (neulingRolle) member.roles.add(neulingRolle);
});

// ===== SLASH COMMANDS =====
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Nur im #befehle Kanal
  if (interaction.channel?.name !== BEFEHLE_KANAL) {
    return interaction.reply({ content: `❌ Befehle nur im **#${BEFEHLE_KANAL}** Kanal!`, ephemeral: true });
  }

  const { commandName, member, guild } = interaction;

  // --- /help ---
  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#00CED1')
      .setTitle('📖 Alle Befehle')
      .addFields(
        { name: '🎮 Allgemein', value: '`/help` – Diese Hilfe\n`/ip` – Server-IP\n`/ränge` – Alle Ränge' },
        { name: '⚙️ Moderation', value: '`/rang @user Rang` – Rang vergeben\n`/kick @user` – Kicken\n`/ban @user` – Bannen\n`/mute @user` – Stumm\n`/unmute @user` – Entstummen\n`/clear Anzahl` – Nachrichten löschen' },
      )
      .setFooter({ text: 'BestClan Bot' });
    return interaction.reply({ embeds: [embed] });
  }

  // --- /ip ---
  if (commandName === 'ip') {
    const embed = new EmbedBuilder()
      .setColor('#228B22')
      .setTitle('🗺️ Minecraft Server-IP')
      .setDescription(`**IP:** \`${SERVER_IP}\`\n**Port:** \`25565\`\n**Version:** Java Edition`)
      .setFooter({ text: 'Viel Spaß! ⛏️' });
    return interaction.reply({ embeds: [embed] });
  }

  // --- /ränge ---
  if (commandName === 'ränge') {
    const liste = RAENGE.map((r, i) => `**${i + 1}.** ${r.name}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Alle Ränge')
      .setDescription(liste)
      .setFooter({ text: 'Ränge werden vom Admin vergeben' });
    return interaction.reply({ embeds: [embed] });
  }

  // --- /rang ---
  if (commandName === 'rang') {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: '❌ Du hast keine Berechtigung!', ephemeral: true });
    }
    const ziel = interaction.options.getMember('user');
    const rangNr = parseInt(interaction.options.getString('rang'));
    const neuerRang = RAENGE[rangNr - 1];

    for (const rang of RAENGE) {
      const rolle = guild.roles.cache.find(r => r.name === rang.name);
      if (rolle) await ziel.roles.remove(rolle).catch(() => {});
    }

    const neueRolle = guild.roles.cache.find(r => r.name === neuerRang.name);
    if (!neueRolle) return interaction.reply({ content: `❌ Rolle "${neuerRang.name}" nicht gefunden!`, ephemeral: true });

    await ziel.roles.add(neueRolle);
    return interaction.reply({ content: `✅ ${ziel} hat jetzt den Rang **${neuerRang.name}**!` });
  }

  // --- /kick ---
  if (commandName === 'kick') {
    if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply({ content: '❌ Keine Berechtigung!', ephemeral: true });
    }
    const ziel = interaction.options.getMember('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund';
    await ziel.kick(grund);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** wurde gekickt. Grund: ${grund}` });
  }

  // --- /ban ---
  if (commandName === 'ban') {
    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ content: '❌ Keine Berechtigung!', ephemeral: true });
    }
    const ziel = interaction.options.getMember('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund';
    await ziel.ban({ reason: grund });
    return interaction.reply({ content: `✅ **${ziel.user.tag}** wurde gebannt. Grund: ${grund}` });
  }

  // --- /mute ---
  if (commandName === 'mute') {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: '❌ Keine Berechtigung!', ephemeral: true });
    }
    const ziel = interaction.options.getMember('user');
    await ziel.timeout(10 * 60 * 1000);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** wurde für 10 Minuten stummgeschaltet.` });
  }

  // --- /unmute ---
  if (commandName === 'unmute') {
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: '❌ Keine Berechtigung!', ephemeral: true });
    }
    const ziel = interaction.options.getMember('user');
    await ziel.timeout(null);
    return interaction.reply({ content: `✅ **${ziel.user.tag}** wurde entstummt.` });
  }

  // --- /clear ---
  if (commandName === 'clear') {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({ content: '❌ Keine Berechtigung!', ephemeral: true });
    }
    const messageId = interaction.options.getString('message_id');
    const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
    if (!msg) return interaction.reply({ content: '❌ Nachricht nicht gefunden!', ephemeral: true });
    await msg.delete();
    return interaction.reply({ content: '✅ Nachricht gelöscht!', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
