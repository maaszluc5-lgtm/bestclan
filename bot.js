const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const PREFIX = '!';

// ===== RANG-NAMEN (passe die IDs nach Erstellen der Rollen an) =====
const RAENGE = [
  { name: '🪵 Neuling',        farbe: '#808080' },
  { name: '⛏️ Bergmann',       farbe: '#8B4513' },
  { name: '🌾 Siedler',        farbe: '#228B22' },
  { name: '🗡️ Kämpfer',        farbe: '#006400' },
  { name: '🏹 Jäger',          farbe: '#0000FF' },
  { name: '🔮 Zauberer',       farbe: '#800080' },
  { name: '🐉 Drachenjäger',   farbe: '#FFA500' },
  { name: '💎 Diamant-Ritter', farbe: '#00CED1' },
  { name: '🌟 Nether-Lord',    farbe: '#FF0000' },
  { name: '👑 Legende',        farbe: '#FFD700' },
];

// ===== BOT BEREIT =====
client.once('ready', () => {
  console.log(`✅ Bot ist online als ${client.user.tag}`);
});

// ===== WILLKOMMENSNACHRICHT =====
client.on('guildMemberAdd', async (member) => {
  const kanal = member.guild.channels.cache.find(c => c.name === 'willkommen');
  if (!kanal) return;

  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('⚔️ Willkommen auf dem Server!')
    .setDescription(`Hey ${member}! Willkommen auf unserem Minecraft-Server! 🎮\n\nLies dir die **#regeln** durch und viel Spaß beim Spielen!`)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: `Mitglied #${member.guild.memberCount}` })
    .setTimestamp();

  kanal.send({ embeds: [embed] });

  // Neuling-Rolle automatisch vergeben
  const neulingRolle = member.guild.roles.cache.find(r => r.name === '🪵 Neuling');
  if (neulingRolle) member.roles.add(neulingRolle);
});

// ===== BEFEHLE =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // --- !help ---
  if (command === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#00CED1')
      .setTitle('📖 Alle Befehle')
      .addFields(
        { name: '🎮 Allgemein', value: '`!help` – Diese Hilfe\n`!ip` – Server-IP anzeigen\n`!ränge` – Alle Ränge anzeigen' },
        { name: '⚙️ Moderation (nur Admins)', value: '`!rang @user <1-10>` – Rang vergeben\n`!kick @user [Grund]` – Kicken\n`!ban @user [Grund]` – Bannen\n`!mute @user` – Stumm schalten\n`!unmute @user` – Entstummen\n`!clear <Anzahl>` – Nachrichten löschen' },
      )
      .setFooter({ text: 'Minecraft Discord Bot' });
    message.reply({ embeds: [embed] });
  }

  // --- !ip ---
  else if (command === 'ip') {
    const embed = new EmbedBuilder()
      .setColor('#228B22')
      .setTitle('🗺️ Server-IP')
      .setDescription('**IP:** `deine.server.ip`\n**Port:** `25565`\n**Version:** Java Edition')
      .setFooter({ text: 'Viel Spaß! ⛏️' });
    message.reply({ embeds: [embed] });
  }

  // --- !ränge ---
  else if (command === 'ränge' || command === 'raenge') {
    const liste = RAENGE.map((r, i) => `**${i + 1}.** ${r.name}`).join('\n');
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Alle Ränge')
      .setDescription(liste)
      .setFooter({ text: 'Ränge werden vom Admin vergeben' });
    message.reply({ embeds: [embed] });
  }

  // --- !rang @user <1-10> ---
  else if (command === 'rang') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply('❌ Du hast keine Berechtigung dafür!');
    }
    const ziel = message.mentions.members.first();
    const rangNr = parseInt(args[1]);

    if (!ziel) return message.reply('❌ Bitte markiere einen User: `!rang @user <1-10>`');
    if (!rangNr || rangNr < 1 || rangNr > 10) return message.reply('❌ Gib eine Zahl von 1–10 an!');

    // Alle Ränge entfernen
    for (const rang of RAENGE) {
      const rolle = message.guild.roles.cache.find(r => r.name === rang.name);
      if (rolle) await ziel.roles.remove(rolle).catch(() => {});
    }

    // Neuen Rang vergeben
    const neuerRang = RAENGE[rangNr - 1];
    const neueRolle = message.guild.roles.cache.find(r => r.name === neuerRang.name);
    if (!neueRolle) return message.reply(`❌ Rolle "${neuerRang.name}" nicht gefunden! Erstelle sie zuerst im Server.`);

    await ziel.roles.add(neueRolle);
    message.reply(`✅ ${ziel} hat jetzt den Rang **${neuerRang.name}**!`);
  }

  // --- !kick ---
  else if (command === 'kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('❌ Du hast keine Berechtigung dafür!');
    }
    const ziel = message.mentions.members.first();
    if (!ziel) return message.reply('❌ Bitte markiere einen User: `!kick @user [Grund]`');
    const grund = args.slice(1).join(' ') || 'Kein Grund angegeben';
    await ziel.kick(grund);
    message.reply(`✅ **${ziel.user.tag}** wurde gekickt. Grund: ${grund}`);
  }

  // --- !ban ---
  else if (command === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('❌ Du hast keine Berechtigung dafür!');
    }
    const ziel = message.mentions.members.first();
    if (!ziel) return message.reply('❌ Bitte markiere einen User: `!ban @user [Grund]`');
    const grund = args.slice(1).join(' ') || 'Kein Grund angegeben';
    await ziel.ban({ reason: grund });
    message.reply(`✅ **${ziel.user.tag}** wurde gebannt. Grund: ${grund}`);
  }

  // --- !mute ---
  else if (command === 'mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Du hast keine Berechtigung dafür!');
    }
    const ziel = message.mentions.members.first();
    if (!ziel) return message.reply('❌ Bitte markiere einen User: `!mute @user`');
    await ziel.timeout(10 * 60 * 1000); // 10 Minuten
    message.reply(`✅ **${ziel.user.tag}** wurde für 10 Minuten stummgeschaltet.`);
  }

  // --- !unmute ---
  else if (command === 'unmute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('❌ Du hast keine Berechtigung dafür!');
    }
    const ziel = message.mentions.members.first();
    if (!ziel) return message.reply('❌ Bitte markiere einen User: `!unmute @user`');
    await ziel.timeout(null);
    message.reply(`✅ **${ziel.user.tag}** wurde entstummt.`);
  }

  // --- !clear ---
  else if (command === 'clear') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return message.reply('❌ Du hast keine Berechtigung dafür!');
    }
    const anzahl = parseInt(args[0]);
    if (!anzahl || anzahl < 1 || anzahl > 100) return message.reply('❌ Gib eine Zahl von 1–100 an!');
    await message.channel.bulkDelete(anzahl + 1, true);
    const info = await message.channel.send(`✅ **${anzahl}** Nachrichten gelöscht.`);
    setTimeout(() => info.delete(), 3000);
  }
});

client.login(process.env.TOKEN);
