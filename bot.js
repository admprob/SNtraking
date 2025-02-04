const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config(); // Untuk menggunakan variabel lingkungan

const token = process.env.TELEGRAM_BOT_TOKEN; // Token dari .env
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Halo! Saya adalah bot Telegram yang dibuat dengan Node.js 🚀");
});

bot.onText(/\/serial (\d+) (\d+)/, (msg, match) => {
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);

    if (end - start > 50) { // Batas agar tidak terlalu banyak data
        return bot.sendMessage(msg.chat.id, "Batas maksimum hanya 50 angka!");
    }

    let serials = [];
    for (let i = start; i <= end; i++) {
        serials.push(i);
    }

    bot.sendMessage(msg.chat.id, serials.join("\n"));
});

console.log("Bot sedang berjalan...");
