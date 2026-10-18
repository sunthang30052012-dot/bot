const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

app.get('/', (req, res) => { res.send('Bot KingMC dang hoat dong!'); });
app.listen(process.env.PORT || 3000, () => { console.log('Web server da san sang.'); });

const config = {
  host: 'kingmc.vn',
  username: 'ipttdup',
  version: '1.20.1',
  matkhau: 'Sam270311'
};

let bot;
let farmInterval;

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
  });

  bot.on('spawn', () => {
    console.log('[INFO] Bot da xuat hien tai sanh.');
    
    // 1. Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 2 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // 2. VƯỢT SẢNH BẰNG ĐỘNG TÁC DI CHUYỂN: Đợi đăng nhập xong, bot sẽ tự động
    // nhấn nút đi thẳng (phím W) trong 3 giây để lao thẳng vào Cổng dịch chuyển ở sảnh
    setTimeout(() => {
      console.log('[LOBBY] Kick hoat di chuyen: Bot dang chay vao Cong dich chuyen...');
      bot.setControlState('forward', true); // Giữ phím đi thẳng
      
      // Hẹn giờ sau 3 giây thì thả phím đi thẳng ra
      setTimeout(() => {
        bot.setControlState('forward', false);
        console.log('[LOBBY] Bot da dung chay, dang kiem tra dich chuyen...');
      }, 3000);
    }, 6000);

    // 3. CHẾ ĐỘ SIÊU FARM: Tự động nhắm mục tiêu quái vật sát cạnh để chém
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        const target = bot.nearestEntity((entity) => entity.type === 'mob' || entity.type === 'player');
        if (target) {
          bot.attack(target); 
        }
      }
    }, 1000); 
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
