const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Simpan riwayat permintaan
let history = [];

// Menu utama dengan tombol inline
const mainMenu = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "📜 Melihat Riwayat", callback_data: "view_history" }],
            [{ text: "📤 Mengekspor Riwayat ke CSV", callback_data: "export_csv" }],
            [{ text: "📅 Melihat Riwayat Berdasarkan Tanggal", callback_data: "filter_by_date" }]
        ]
    }
};

// 🔹 MEMUNCULKAN MENU HANYA SAAT DIPERLUKAN
bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "🔹 Pilih menu di bawah:", mainMenu);
});

// 🔹 MENYIMPAN RIWAYAT SERIAL NUMBER (Tanpa menampilkan menu setiap kali)
bot.onText(/\/serial (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);

    if (end - start > 100) {
        return bot.sendMessage(chatId, "⚠️ Batas maksimum hanya 100 angka!");
    }

    let serials = [];
    for (let i = start; i <= end; i++) {
        serials.push(i);
    }

    // Simpan ke riwayat
    const record = { user: msg.from.username, date: new Date().toISOString(), serials };
    history.push(record);

    // Kirim hasil tanpa menu
    bot.sendMessage(chatId, `✅ **Serial Number:**\n${serials.join("\n")}`);
});

// 🔹 MENU LAINNYA TETAP INTERAKTIF
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "view_history") {
        if (history.length === 0) {
            return bot.sendMessage(chatId, "⚠️ Belum ada riwayat.");
        }

        let message = "📜 **Riwayat Permintaan:**\n";
        history.forEach((h, index) => {
            message += `\n${index + 1}. 🕒 ${h.date}\n👤 User: ${h.user}\n🔢 Serial:\n${h.serials.join("\n")}\n`;
        });

        bot.sendMessage(chatId, message);
    }

    if (data === "export_csv") {
        if (history.length === 0) {
            return bot.sendMessage(chatId, "⚠️ Tidak ada data untuk diekspor.");
        }

        const csvData = "Tanggal,User,Serial Number\n" +
            history.map(h => `${h.date},${h.user},"${h.serials.join(" ")}"`).join("\n");

        const filePath = "history.csv";
        fs.writeFileSync(filePath, csvData);

        bot.sendDocument(chatId, filePath, {}, { filename: "history.csv" });
    }

    if (data === "filter_by_date") {
        bot.sendMessage(chatId, "📅 Masukkan tanggal dalam format **YYYY-MM-DD**, contoh: `/filter 2025-02-04`");
    }
});

// 🔹 FILTER DATA BERDASARKAN TANGGAL
bot.onText(/\/filter (\d{4}-\d{2}-\d{2})/, (msg, match) => {
    const chatId = msg.chat.id;
    const selectedDate = match[1];

    const filtered = history.filter(h => h.date.startsWith(selectedDate));

    if (filtered.length === 0) {
        return bot.sendMessage(chatId, `❌ Tidak ada riwayat untuk tanggal ${selectedDate}`);
    }

    let message = `📅 **Riwayat untuk ${selectedDate}:**\n`;
    filtered.forEach((h, index) => {
        message += `\n${index + 1}. 👤 User: ${h.user}\n🔢 Serial:\n${h.serials.join("\n")}\n`;
    });

    bot.sendMessage(chatId, message);
});

console.log("🤖 Bot sedang berjalan...");
