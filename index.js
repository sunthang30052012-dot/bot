const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

app.get('/', (req, res) => { res.send('Bot King Legacy đang hoạt động!'); });
app.listen(process.env.PORT || 3000, () => { console.log('Web server đã sẵn sàng.'); });

// === ĐIỀN THÔNG TIN SERVER VÀ TÀI KHOẢN CỦA BẠN VÀO ĐÂY ===
const config = {
  host: 'IP_SERVER_CỦA_BẠN',     // Thay bằng IP server King Legacy bạn chơi
  username: 'TenBot_SieuFarm',  // Đặt tên nick cho tài khoản Bot
  version: '1.20.1',            // Sửa đúng phiên bản Minecraft của Server
  matkhau: 'MatKhauCuaBot123'   // Mật khẩu để bot tự động gõ /login
};

let bot;
function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { console.log(`[OK] Bot ${bot.username} đã vào mạng.`); });

  bot.on('spawn', () => {
    console.log('[INFO] Bot đã vào thế giới. Bắt đầu treo farm...');
    
    // Tự động Click chuột trái mỗi 1 giây để chém quái
    setInterval(() => {
      if (bot.entity) bot.swingHand('right');
    }, 1000);

    // Anti-AFK: Cứ 45 giây nhảy 1 cái chống bị kick
    setInterval(() => {
      if (bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => bot.setControlState('jump', false), 400);
      }
    }, 45000);
  });

  bot.on('chat', (username, message) => {
    if (message.includes('/login') || message.includes('đăng nhập')) {
      bot.chat(`/login ${config.matkhau}`);
      console.log('[AUTH] Đã tự động đăng nhập.');
    }
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mất kết nối: ${reason}. Vào lại sau 30s...`);
    setTimeout(startBot, 30000);
  });
  bot.on('error', (err) => { console.log(`[LỖI] ${err.message}`); });
}

startBot();
