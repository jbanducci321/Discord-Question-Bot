import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const commands = [
    new SlashCommandBuilder()
        .setName('addquote')
        .setDescription('Add a new quote')
        .addStringOption(option =>
            option.setName('person')
                .setDescription('Who said the quote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category for the quote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('quote')
                .setDescription('The quote text')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('randomquote')
        .setDescription('Get a random quote'),

    new SlashCommandBuilder()
        .setName('quotesbyperson')
        .setDescription('Get a random quote from a specific person')
        .addStringOption(option =>
            option.setName('person')
                .setDescription('Person name')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('quotesbycategory')
        .setDescription('Get a random quote from a category')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category name')
                .setRequired(true)),

    new SlashCommandBuilder()
        .setName('editquote')
        .setDescription('Edit an existing quote')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('Quote ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('quote')
                .setDescription('New quote text')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('person')
                .setDescription('New person name')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('New category')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName('deletequote')
        .setDescription('Delete a quote by ID')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('Quote ID')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
        .setName('everyonequote')
        .setDescription('Ping everyone and post a random quote')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
    console.log('Registering slash commands...');
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
    );
    console.log('Slash commands registered successfully.');
} catch (error) {
    console.error(error);
}