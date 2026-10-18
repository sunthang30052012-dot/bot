const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

app.get('/', (req, res) => { res.send('Bot KingMC dang hoat dong!'); });
app.listen(process.env.PORT || 3000, () => { console.log('Web server da san sang.'); });

// === THÔNG TIN TÀI KHOẢN BOT ===
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
    
    // Tự động gõ lệnh đăng nhập /dn
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // Cầm đồng hồ ở ô số 5 và bấm chuột phải để mở Menu
    setTimeout(() => {
      console.log('[LOBBY] Dang chuan bi mo Menu bang Dong ho...');
      bot.setQuickBarSlot(4); 
      
      setTimeout(() => {
        bot.activateItem(); 
      }, 1500);
    }, 5000);

    // Chế độ siêu farm tự động vung tay chém liên tục
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        bot.swingHand('arm'); 
      }
    }, 1000); 
  });

  // Tự động click vào cụm KingSMP khi menu đồng hồ mở ra
  bot.on('windowOpen', async (window) => {
    console.log('[MENU] Da mo Menu Dong ho thanh cong.');
    const item = window.slots.find(slot => slot && slot.displayName && slot.displayName.includes('King'));
    
    if (item) {
      console.log(`[LOBBY] Dang click chon cum: ${item.displayName}`);
      await bot.clickWindow(item.slot, 0, 0); 
    } else {
      console.log('[LOBBY] Tu dong chon o mac dinh trong Menu...');
      await bot.clickWindow(4, 0, 0); 
    }
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
