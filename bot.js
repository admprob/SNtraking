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

bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "🔹 Pilih menu di bawah:", mainMenu);
});

// 🔹 Fungsi untuk mengambil serial berurutan
bot.onText(/\/sn (\d+) (\d+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const start = parseInt(match[1]);
    const end = parseInt(match[2]);

    if (end - start > 100) {
        return bot.sendMessage(chatId, "⚠️ Batas maksimum hanya 100 angka!");
    }

    let serials = [];
    for (let i = start; i <= end; i++) {
        serials.push(i.toString());
    }

    saveHistory(msg.from.username, serials);
    bot.sendMessage(chatId, `✅ **Serial Number:**\n${serials.join("\n")}`);
});

// 🔹 Fungsi untuk mengambil serial dengan prefix
bot.onText(/\/sn (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const inputSerials = match[1].split(",").map(num => num.trim());
    let serials = [];
    
    if (inputSerials.length === 0) {
        return bot.sendMessage(chatId, "⚠️ Mohon masukkan angka yang valid!");
    }

    let prefix = inputSerials[0].length > 4 ? inputSerials[0].slice(0, -4) : "";
    inputSerials.forEach(num => {
        serials.push(num.length <= 4 && prefix ? `${prefix}${num.padStart(4, "0")}` : num);
    });

    if (serials.length > 50) {
        return bot.sendMessage(chatId, "⚠️ Maksimal hanya bisa 50 angka!");
    }

    saveHistory(msg.from.username, serials);
    bot.sendMessage(chatId, `✅ **Serial Number:**\n${serials.join("\n")}`);
});

// 🔹 Fungsi untuk menyimpan riwayat
function saveHistory(user, serials) {
    const record = { user, date: new Date().toISOString(), serials };
    history.push(record);
}

// 🔹 Menampilkan riwayat sebagai tombol interaktif
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data === "view_history") {
        if (history.length === 0) return bot.sendMessage(chatId, "⚠️ Belum ada riwayat.");

        let options = {
            reply_markup: {
                inline_keyboard: history.map((h, index) => [
                    [{ text: `📌 ${h.serials[0]} → ${h.serials[h.serials.length - 1]} (🕒 ${formatDate(h.date)})`, callback_data: `history_${index}` }]
                ])
            }
        };
        bot.sendMessage(chatId, "📜 **Riwayat Serial Number:**", options);
    }

    if (data.startsWith("history_")) {
        const index = parseInt(data.split("_")[1]);
        if (history[index]) {
            const record = history[index];
            bot.sendMessage(chatId, `✅ **Detail Serial Number:**\n${record.serials.join("\n")}`);
        }
    }

    if (data === "export_csv") {
        if (history.length === 0) return bot.sendMessage(chatId, "⚠️ Tidak ada data untuk diekspor.");
        
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

// 🔹 Filter riwayat berdasarkan tanggal
bot.onText(/\/filter (\d{4}-\d{2}-\d{2})/, (msg, match) => {
    const chatId = msg.chat.id;
    const selectedDate = match[1];

    const filtered = history.filter(h => h.date.startsWith(selectedDate));
    if (filtered.length === 0) return bot.sendMessage(chatId, `❌ Tidak ada riwayat untuk tanggal ${selectedDate}`);

    let message = `📅 **Riwayat untuk ${selectedDate}:**\n`;
    filtered.forEach((h, index) => {
        message += `\n${index + 1}. 👤 User: ${h.user}\n🔢 Serial:\n${h.serials.join("\n")}\n`;
    });
    bot.sendMessage(chatId, message);
});

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)} ` +
           `${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}:${("0" + date.getSeconds()).slice(-2)}`;
}

console.log("🤖 Bot sedang berjalan...");
