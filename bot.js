const TelegramBot = require("node-telegram-bot-api");
const fs = require('fs');
const Tesseract = require("tesseract.js"); // Tambahkan pustaka Tesseract.js
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const history = []; // Menyimpan riwayat permintaan pengguna

// 📌 Perintah untuk menerima gambar dan memprosesnya
bot.on("photo", (msg) => {
    const chatId = msg.chat.id;
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    bot.getFileLink(fileId).then((url) => {
        // Gunakan Tesseract untuk mengonversi gambar menjadi teks
        Tesseract.recognize(
            url, 
            'eng',
            {
                logger: (m) => console.log(m), // Log proses OCR
            }
        ).then(({ data: { text } }) => {
            // Menangani hasil OCR
            const extractedSerials = text.match(/\d+/g); // Menangkap semua angka
            if (extractedSerials) {
                // Simpan hasil OCR ke riwayat
                const record = { user: msg.from.username, date: new Date().toISOString(), serials: extractedSerials };
                history.push(record);

                // Kirim hasil serial number yang ditemukan
                bot.sendMessage(chatId, `✅ **Serial Number yang ditemukan:**\n${extractedSerials.join("\n")}`);
            } else {
                bot.sendMessage(chatId, "⚠️ Tidak ada serial number yang terdeteksi dalam gambar.");
            }
        }).catch((err) => {
            bot.sendMessage(chatId, "⚠️ Terjadi kesalahan saat memproses gambar.");
            console.error(err);
        });
    }).catch((err) => {
        bot.sendMessage(chatId, "⚠️ Gagal mendapatkan file gambar.");
        console.error(err);
    });
});

// 📌 Perintah untuk mendapatkan serial secara berurutan
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
    const options = {
        reply_markup: {
            inline_keyboard: history.map((record, index) => [
                {
                    text: `📌 ${record.serials[0]} → ${record.serials[record.serials.length - 1]} (🕒 ${formatDate(record.date)})`,
                    callback_data: `history_${index}`
                }
            ])
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
