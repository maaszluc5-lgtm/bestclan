const {
  Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ChannelType, REST, Routes
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const TICKET_KATEGORIE = '🎫-tickets';
const LOG_KANAL = 'ticket-logs';
const STAFF_ROLLE = '🛡️ Moderator';

const TICKET_TYPEN = [
  { id: 'support',    emoji: '🎫', name: 'Support Anfrage',        farbe: '#00CED1' },
  { id: 'bug',        emoji: '🐛', name: 'Bug melden',             farbe: '#FF0000' },
  { id: 'frage',      emoji: '❓', name: 'Allgemeine Frage',       farbe: '#9B59B6' },
  { id: 'beschwerde', emoji: '⚔️', name: 'Beschwerde',             farbe: '#FF8C00' },
  { id: 'bewerbung',  emoji: '🤝', name: 'Bewerbung (Staff)',      farbe: '#228B22' },
  { id: 'mod',        emoji: '🛡️', name: 'Moderator anschreiben', farbe: '#0000FF' },
  { id: 'sup',        emoji: '💙', name: 'Supporter anschreiben', farbe: '#1ABC9C' },
  { id: 'content',    emoji: '🎨', name: 'Content anschreiben',   farbe: '#9B59B6' },
];

const offeneTickets = new Map();

client.once('ready', async () => {
  console.log(`✅ Support-Bot online als ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: [
      { name: 'support_setup', description: '⚙️ Erstellt den Support-Button (nur Admin)' },
      { name: 'ticket_close',  description: '🔒 Schließt das aktuelle Ticket' },
    ]
  });
  console.log('✅ Slash-Commands registriert!');
});

client.on('interactionCreate', async (interaction) => {

  if (interaction.isChatInputCommand()) {
    if (interaction.channel?.name !== 'befehle' && interaction.commandName !== 'support_setup') {
      return interaction.reply({ content: '❌ Befehle nur im **#befehle** Kanal!', ephemeral: true });
    }

    if (interaction.commandName === 'support_setup') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ Nur Admins!', ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor('#00CED1')
        .setTitle('🎫 Support Center')
        .setDescription('Brauchst du Hilfe? Klicke auf den Button und wähle dein Anliegen!')
        .addFields(TICKET_TYPEN.map(t => ({ name: `${t.emoji} ${t.name}`, value: '\u200b', inline: true })))
        .setFooter({ text: 'Ein Staff-Mitglied wird sich so schnell wie möglich melden!' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('support_oeffnen').setLabel('🎫 Ticket öffnen').setStyle(ButtonStyle.Primary)
      );
      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ content: '✅ Support wurde eingerichtet!', ephemeral: true });
    }

    if (interaction.commandName === 'ticket_close') {
      const staffRolle = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLLE);
      const istStaff = interaction.member.roles.cache.has(staffRolle?.id);
      if (!istStaff && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: '❌ Nur Staff kann Tickets schließen!', ephemeral: true });
      }
      await interaction.reply('🔒 Ticket wird in 5 Sekunden geschlossen...');
      setTimeout(async () => {
        for (const [userId, kanalId] of offeneTickets.entries()) {
          if (kanalId === interaction.channel.id) offeneTickets.delete(userId);
        }
        await interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }

  if (interaction.isButton() && interaction.customId === 'support_oeffnen') {
    const select = new StringSelectMenuBuilder()
      .setCustomId('support_auswahl')
      .setPlaceholder('Welche Art von Support brauchst du?')
      .addOptions(TICKET_TYPEN.map(t => ({ label: `${t.emoji} ${t.name}`, value: t.id })));
    return interaction.reply({
      content: '🎫 Wähle dein Anliegen:',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true
    });
  }

  if (interaction.isButton() && interaction.customId === 'ticket_close_btn') {
    const staffRolle = interaction.guild.roles.cache.find(r => r.name === STAFF_ROLLE);
    const istStaff = interaction.member.roles.cache.has(staffRolle?.id);
    if (!istStaff && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Nur Staff kann Tickets schließen!', ephemeral: true });
    }
    await interaction.reply('🔒 Ticket wird in 5 Sekunden geschlossen...');
    setTimeout(async () => {
      for (const [userId, kanalId] of offeneTickets.entries()) {
        if (kanalId === interaction.channel.id) offeneTickets.delete(userId);
      }
      await interaction.channel.delete().catch(() => {});
    }, 5000);
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'support_auswahl') {
    const typ = TICKET_TYPEN.find(t => t.id === interaction.values[0]);
    if (!typ) return interaction.reply({ content: '❌ Fehler!', ephemeral: true });

    if (offeneTickets.has(interaction.user.id)) {
      return interaction.reply({ content: `❌ Du hast bereits ein offenes Ticket! <#${offeneTickets.get(interaction.user.id)}>`, ephemeral: true });
    }

    const guild = interaction.guild;
    const staffRolle = guild.roles.cache.find(r => r.name === STAFF_ROLLE);
    const kategorie = guild.channels.cache.find(c => c.name === TICKET_KATEGORIE && c.type === ChannelType.GuildCategory);

    const staffRollenMap = { 'mod': '🛡️ Moderator', 'sup': '💙 Supporter', 'content': '🎨 Content' };
    const zielRolleName = staffRollenMap[typ.id];
    const zielRolle = zielRolleName ? guild.roles.cache.find(r => r.name === zielRolleName) : null;

    const ticketKanal = await guild.channels.create({
      name: `${typ.emoji}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: kategorie || null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ...(staffRolle ? [{ id: staffRolle.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] : []),
        ...(zielRolle ? [{ id: zielRolle.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] : []),
      ],
    });

    offeneTickets.set(interaction.user.id, ticketKanal.id);

    const embed = new EmbedBuilder()
      .setColor(typ.farbe)
      .setTitle(`${typ.emoji} ${typ.name}`)
      .setDescription(`Hey ${interaction.user}! Ein Staff-Mitglied wird sich gleich melden.\n\nBeschreibe dein Anliegen so genau wie möglich! 👇`)
      .setFooter({ text: 'Ticket schließen → /ticket_close' })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_btn').setLabel('🔒 Ticket schließen').setStyle(ButtonStyle.Danger)
    );

    const ping = zielRolle ? `${zielRolle}` : (staffRolle ? `${staffRolle}` : '');
    await ticketKanal.send({ content: `${interaction.user} ${ping}`, embeds: [embed], components: [closeRow] });

    const logKanal = guild.channels.cache.find(c => c.name === LOG_KANAL);
    if (logKanal) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('📋 Neues Ticket')
        .addFields(
          { name: 'User', value: interaction.user.tag, inline: true },
          { name: 'Typ', value: `${typ.emoji} ${typ.name}`, inline: true },
          { name: 'Kanal', value: `${ticketKanal}`, inline: true },
        )
        .setTimestamp();
      logKanal.send({ embeds: [logEmbed] });
    }

    return interaction.reply({ content: `✅ Ticket erstellt! ${ticketKanal}`, ephemeral: true });
  }
});

client.login(process.env.TOKEN);
