const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const history = []; // Simpan riwayat permintaan

// Menu utama
const mainMenu = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "📜 Melihat Riwayat", callback_data: "view_history" }],
            [{ text: "📤 Mengekspor Riwayat ke CSV", callback_data: "export_csv" }],
            [{ text: "📅 Melihat Riwayat Berdasarkan Tanggal", callback_data: "filter_by_date" }]
        ]
    }
};

// 🔹 Menampilkan menu saat diminta
bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "🔹 Pilih menu di bawah:", mainMenu);
});

bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "view_history") {
        // Logika untuk melihat riwayat
    } else if (data === "export_csv") {
        // Logika untuk mengekspor riwayat ke CSV
    } else if (data === "filter_by_date") {
        // Logika untuk memfilter riwayat berdasarkan tanggal
    }
});

// 📌 Perintah untuk mendapatkan serial (Bisa Rentang atau Manual)
bot.onText(/\/sn (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const input = match[1].trim();

    let serials = [];

    // Jika input adalah dua angka (range)
    const rangeMatch = input.match(/^(\d+)\s+(\d+)$/);
    if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);

        if (end - start > 100) {
            return bot.sendMessage(chatId, "⚠️ Batas maksimum hanya 100 angka!");
        }

        for (let i = start; i <= end; i++) {
            serials.push(i.toString());
        }
    } else {
        // Jika input adalah angka manual (dengan prefix)
        const inputSerials = input.split(",").map(num => num.trim());
        if (inputSerials.length === 0) {
            return bot.sendMessage(chatId, "⚠️ Mohon masukkan angka yang valid!");
        }

        let prefix = inputSerials[0].length > 4 ? inputSerials[0].slice(0, -4) : "";

        inputSerials.forEach(num => {
            if (num.length <= 4 && prefix) {
                serials.push(`${prefix}${num.padStart(4, "0")}`);
            } else {
                serials.push(num);
            }
        });

        if (serials.length > 50) {
            return bot.sendMessage(chatId, "⚠️ Maksimal hanya bisa 50 angka!");
        }
    }

    // Simpan ke riwayat
    const record = { user: msg.from.username, date: new Date().toISOString(), serials };
    history.push(record);

    // Kirim hasil
    bot.sendMessage(chatId, `✅ **Serial Number:**\n${serials.join("\n")}`);
});

// 📌 Perintah untuk melihat daftar riwayat
bot.onText(/\/history/, (msg) => {
    const chatId = msg.chat.id;

    if (history.length === 0) {
        return bot.sendMessage(chatId, "📌 Belum ada riwayat tersedia.");
    }

    // Buat daftar tombol untuk setiap riwayat
    let options = {
        reply_markup: {
            inline_keyboard: history.map((record, index) => {
                if (record.serials.length === 0) return []; // Hindari error jika kosong
                return [{
                    text: `📌 ${record.serials[0]} → ${record.serials[record.serials.length - 1]} (🕒 ${formatDate(record.date)})`,
                    callback_data: `history_${index}`
                }];
            }).filter(row => row.length > 0) // Hapus baris kosong untuk menghindari error
        }
    };

    bot.sendMessage(chatId, "📜 **Riwayat Serial Number:**", options);
});

// 📌 Fungsi untuk menampilkan detail saat tombol riwayat ditekan
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith("history_")) {
        const index = parseInt(data.split("_")[1]);
        if (history[index]) {
            const record = history[index];
            const serialsList = record.serials.join("\n");
            bot.sendMessage(chatId, `✅ **Detail Serial Number:**\n${serialsList}`);
        } else {
            bot.sendMessage(chatId, "⚠️ Riwayat tidak ditemukan.");
        }
    }
});

// 📌 Fungsi untuk memformat tanggal agar lebih mudah dibaca
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)} ` +
           `${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}:${("0" + date.getSeconds()).slice(-2)}`;
}

console.log("🤖 Bot sedang berjalan...");
