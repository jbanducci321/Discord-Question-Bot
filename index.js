import 'dotenv/config';
import {
    Client,
    GatewayIntentBits,
    PermissionsBitField
} from 'discord.js';
import pool from './db.js';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS test');
        console.log('Database connected:', rows[0]);
    } catch (err) {
        console.error('Database connection failed:', err);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'addquote') {
            const person = interaction.options.getString('person');
            const category = interaction.options.getString('category');
            const quote = interaction.options.getString('quote');

            const sql = `
                INSERT INTO quote_bot_quotes
                (quote_text, quoted_person, category, added_by_user_id, added_by_username)
                VALUES (?, ?, ?, ?, ?)
            `;

            const sqlParams = [
                quote,
                person,
                category,
                interaction.user.id,
                interaction.user.username
            ];

            const [result] = await pool.query(sql, sqlParams);

            await interaction.reply(
                `Quote added with ID **${result.insertId}**.\n` +
                `**${person}** [${category}]: "${quote}"`
            );
        }

        else if (commandName === 'randomquote') {
            const sql = `
                SELECT id, quote_text, quoted_person, category
                FROM quote_bot_quotes
                ORDER BY RAND()
                LIMIT 1
            `;

            const [rows] = await pool.query(sql);

            if (rows.length === 0) {
                await interaction.reply('No quotes found yet.');
                return;
            }

            const row = rows[0];

            await interaction.reply(
                `**Quote #${row.id}**\n` +
                `**${row.quoted_person}** [${row.category}]:\n"${row.quote_text}"`
            );
        }

        else if (commandName === 'quotesbyperson') {
            const person = interaction.options.getString('person');

            const sql = `
                SELECT id, quote_text, quoted_person, category
                FROM quote_bot_quotes
                WHERE LOWER(quoted_person) = LOWER(?)
                ORDER BY RAND()
                LIMIT 1
            `;

            const [rows] = await pool.query(sql, [person]);

            if (rows.length === 0) {
                await interaction.reply(`No quotes found for **${person}**.`);
                return;
            }

            const row = rows[0];

            await interaction.reply(
                `**Quote #${row.id}**\n` +
                `**${row.quoted_person}** [${row.category}]:\n"${row.quote_text}"`
            );
        }

        else if (commandName === 'quotesbycategory') {
            const category = interaction.options.getString('category');

            const sql = `
                SELECT id, quote_text, quoted_person, category
                FROM quote_bot_quotes
                WHERE LOWER(category) = LOWER(?)
                ORDER BY RAND()
                LIMIT 1
            `;

            const [rows] = await pool.query(sql, [category]);

            if (rows.length === 0) {
                await interaction.reply(`No quotes found in category **${category}**.`);
                return;
            }

            const row = rows[0];

            await interaction.reply(
                `**Quote #${row.id}**\n` +
                `**${row.quoted_person}** [${row.category}]:\n"${row.quote_text}"`
            );
        }

        else if (commandName === 'editquote') {
            if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({
                    content: 'You do not have permission to edit quotes.',
                    ephemeral: true
                });
                return;
            }

            const id = interaction.options.getInteger('id');
            const newQuote = interaction.options.getString('quote');
            const newPerson = interaction.options.getString('person');
            const newCategory = interaction.options.getString('category');

            const [existingRows] = await pool.query(
                'SELECT * FROM quote_bot_quotes WHERE id = ?',
                [id]
            );

            if (existingRows.length === 0) {
                await interaction.reply(`Quote ID **${id}** was not found.`);
                return;
            }

            const existing = existingRows[0];

            const updatedQuote = newQuote ?? existing.quote_text;
            const updatedPerson = newPerson ?? existing.quoted_person;
            const updatedCategory = newCategory ?? existing.category;

            const sql = `
                UPDATE quote_bot_quotes
                SET quote_text = ?, quoted_person = ?, category = ?
                WHERE id = ?
            `;

            await pool.query(sql, [updatedQuote, updatedPerson, updatedCategory, id]);

            await interaction.reply(
                `Quote **#${id}** updated.\n` +
                `**${updatedPerson}** [${updatedCategory}]: "${updatedQuote}"`
            );
        }

        else if (commandName === 'deletequote') {
            if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({
                    content: 'You do not have permission to delete quotes.',
                    ephemeral: true
                });
                return;
            }

            const id = interaction.options.getInteger('id');

            const [rows] = await pool.query(
                'SELECT * FROM quote_bot_quotes WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                await interaction.reply(`Quote ID **${id}** was not found.`);
                return;
            }

            await pool.query('DELETE FROM quote_bot_quotes WHERE id = ?', [id]);

            await interaction.reply(`Deleted quote **#${id}**.`);
        }

        else if (commandName === 'everyonequote') {
            if (!interaction.memberPermissions.has(PermissionsBitField.Flags.ManageGuild)) {
                await interaction.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true
                });
                return;
            }

            const sql = `
                SELECT id, quote_text, quoted_person, category
                FROM quote_bot_quotes
                ORDER BY RAND()
                LIMIT 1
            `;

            const [rows] = await pool.query(sql);

            if (rows.length === 0) {
                await interaction.reply('No quotes found yet.');
                return;
            }

            const row = rows[0];

            await interaction.reply(
                `@everyone\n**Quote #${row.id}**\n` +
                `**${row.quoted_person}** [${row.category}]:\n"${row.quote_text}"`
            );
        }
    } catch (err) {
        console.error(err);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('Something went wrong while processing that command.');
        } else {
            await interaction.reply('Something went wrong while processing that command.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);