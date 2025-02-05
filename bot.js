// Fungsi untuk memformat tanggal
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
}

// Fungsi untuk memformat waktu
function formatTime(dateString) {
    const date = new Date(dateString);
    return `${("0" + date.getHours()).slice(-2)}:${("0" + date.getMinutes()).slice(-2)}:${("0" + date.getSeconds()).slice(-2)}`;
}

// Fungsi untuk menampilkan riwayat yang diringkas
function displayHistory(chatId) {
    if (history.length === 0) {
        return bot.sendMessage(chatId, "📌 Belum ada riwayat tersedia.");
    }

    // Dapatkan tanggal hari ini
    const today = formatDate(new Date().toISOString());

    // Kelompokkan riwayat berdasarkan tanggal
    const groupedHistory = history.reduce((acc, record) => {
        const recordDate = formatDate(record.date);
        if (!acc[recordDate]) {
            acc[recordDate] = [];
        }
        acc[recordDate].push(record);
        return acc;
    }, {});

    // Buat pesan riwayat
    let historyMessage = "📜 **Riwayat Serial Number:**\n\n";
    for (const [date, records] of Object.entries(groupedHistory)) {
        if (date === today) {
            // Tampilkan entri untuk hari ini dengan waktu
            records.forEach(record => {
                historyMessage += `📌 ${record.serials[0]} → ${record.serials[record.serials.length - 1]} (🕒 ${formatTime(record.date)})\n`;
            });
        } else {
            // Tampilkan entri untuk tanggal lain
            historyMessage += `📅 **${date}**\n`;
            records.forEach(record => {
                historyMessage += `    📌 ${record.serials[0]} → ${record.serials[record.serials.length - 1]}\n`;
            });
        }
        historyMessage += "\n";
    }

    bot.sendMessage(chatId, historyMessage);
}

// Contoh penggunaan dalam perintah /history
bot.onText(/\/history/, (msg) => {
    const chatId = msg.chat.id;
    displayHistory(chatId);
});
