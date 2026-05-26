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

// ===== KONFIGURATION =====
const PAYPAL = 'deine@paypal.com'; // <- Deine PayPal E-Mail eintragen
const TICKET_KATEGORIE = '🎫 Tickets'; // Kategorie-Name für Tickets
const LOG_KANAL = 'ticket-logs'; // Kanal für Logs
const STAFF_ROLLE = '🛡️ Moderator'; // Rolle die Tickets sieht

const RAENGE = [
  { name: '👑 Legendär', preis: 150, farbe: '#FFD700' },
  { name: '💎 Ultra',    preis: 100, farbe: '#00FFFF' },
  { name: '🔱 Supreme',  preis: 75,  farbe: '#8B0000' },
  { name: '🪙 Platin',   preis: 50,  farbe: '#C0C0C0' },
  { name: '👴 OG',       preis: 30,  farbe: '#FF8C00' },
];

// Offene Tickets speichern: { userId: kanalId }
const offeneTickets = new Map();

// ===== BOT BEREIT =====
client.once('ready', async () => {
  console.log(`✅ Ticket-Bot online als ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: [
      { name: 'shop', description: '🛒 Zeigt alle käuflichen Ränge' },
      { name: 'ticket_close', description: '🔒 Schließt das aktuelle Ticket' },
      { name: 'ticket_setup', description: '⚙️ Erstellt den Shop-Button (nur Admin)' },
    ]
  });
  console.log('✅ Slash-Commands registriert!');
});

// ===== SLASH COMMANDS =====
client.on('interactionCreate', async (interaction) => {

  // ===== /shop =====
  if (interaction.isChatInputCommand() && interaction.commandName === 'shop') {
    const embed = shopEmbed();
    const row = kaufButton();
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  // ===== /ticket_setup =====
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket_setup') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Nur Admins!', ephemeral: true });
    }
    const embed = shopEmbed();
    const row = kaufButton();
    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: '✅ Shop wurde eingerichtet!', ephemeral: true });
  }

  // ===== /ticket_close =====
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket_close') {
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

  // ===== BUTTON: Rang kaufen =====
  if (interaction.isButton() && interaction.customId === 'rang_kaufen') {
    if (offeneTickets.has(interaction.user.id)) {
      return interaction.reply({ content: `❌ Du hast bereits ein offenes Ticket! <#${offeneTickets.get(interaction.user.id)}>`, ephemeral: true });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('rang_auswahl')
      .setPlaceholder('Welchen Rang möchtest du kaufen?')
      .addOptions(RAENGE.map(r => ({
        label: r.name,
        description: `${r.preis}€`,
        value: r.name,
      })));

    const row = new ActionRowBuilder().addComponents(select);
    return interaction.reply({
      content: '🛒 Welchen Rang möchtest du kaufen?',
      components: [row],
      ephemeral: true
    });
  }

  // ===== SELECT: Rang ausgewählt =====
  if (interaction.isStringSelectMenu() && interaction.customId === 'rang_auswahl') {
    const gewählterRang = RAENGE.find(r => r.name === interaction.values[0]);
    if (!gewählterRang) return interaction.reply({ content: '❌ Fehler!', ephemeral: true });

    // Ticket-Kanal erstellen
    const guild = interaction.guild;
    const staffRolle = guild.roles.cache.find(r => r.name === STAFF_ROLLE);
    const kategorie = guild.channels.cache.find(c => c.name === TICKET_KATEGORIE && c.type === ChannelType.GuildCategory);

    const ticketKanal = await guild.channels.create({
      name: `🎫-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: kategorie || null,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        ...(staffRolle ? [{ id: staffRolle.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }] : []),
      ],
    });

    offeneTickets.set(interaction.user.id, ticketKanal.id);

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_close_btn').setLabel('🔒 Ticket schließen').setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(gewählterRang.farbe)
      .setTitle(`🎫 Rang-Kauf: ${gewählterRang.name}`)
      .setDescription(`Hey ${interaction.user}! Du möchtest den Rang **${gewählterRang.name}** kaufen.\n\n**Preis:** ${gewählterRang.preis}€`)
      .addFields(
        {
          name: '💳 Zahlung per PayPal',
          value: `Sende **${gewählterRang.preis}€** an:\n\`\`\`${PAYPAL}\`\`\`\n⚠️ **Betreff:** ${gewählterRang.name} - ${interaction.user.username}\n⚠️ Nur **Freunde & Familie** senden!`
        },
        {
          name: '🎴 Zahlung per Paysafecard',
          value: `Kaufe eine Paysafecard im Wert von **${gewählterRang.preis}€** und schicke den **PIN-Code** hier im Ticket.`
        },
        {
          name: '✅ Nach der Zahlung',
          value: 'Schicke den **Zahlungsnachweis** (Screenshot) hier rein.\nEin Staff-Mitglied wird deinen Rang so schnell wie möglich vergeben!'
        }
      )
      .setFooter({ text: 'Bei Fragen einfach hier schreiben!' })
      .setTimestamp();

    await ticketKanal.send({ content: `${interaction.user} ${staffRolle ? staffRolle : ''}`, embeds: [embed], components: [closeRow] });

    // Log
    const logKanal = guild.channels.cache.find(c => c.name === LOG_KANAL);
    if (logKanal) {
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('📋 Neues Ticket')
        .addFields(
          { name: 'User', value: `${interaction.user.tag}`, inline: true },
          { name: 'Rang', value: gewählterRang.name, inline: true },
          { name: 'Preis', value: `${gewählterRang.preis}€`, inline: true },
          { name: 'Kanal', value: `${ticketKanal}`, inline: true },
        )
        .setTimestamp();
      logKanal.send({ embeds: [logEmbed] });
    }

    return interaction.reply({ content: `✅ Dein Ticket wurde erstellt! ${ticketKanal}`, ephemeral: true });
  }

  // ===== BUTTON: Ticket schließen (im Ticket selbst) =====
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
});

// ===== HILFSFUNKTIONEN =====
function shopEmbed() {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🛒 Rang-Shop')
    .setDescription('Kaufe dir einen exklusiven Rang und unterstütze den Server!\n\n**Zahlungsmethoden:** PayPal & Paysafecard')
    .addFields(
      RAENGE.map(r => ({
        name: `${r.name}`,
        value: `💰 **${r.preis}€**`,
        inline: true,
      }))
    )
    .setFooter({ text: 'Klicke auf "Rang kaufen" um ein Ticket zu öffnen!' })
    .setTimestamp();
}

function kaufButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('rang_kaufen')
      .setLabel('🛒 Rang kaufen')
      .setStyle(ButtonStyle.Success)
  );
}

client.login(process.env.TOKEN);
