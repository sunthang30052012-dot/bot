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
    
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    setTimeout(() => {
      console.log('[LOBBY] Dang chuan bi mo Menu bang Dong ho...');
      bot.setQuickBarSlot(4); 
      
      setTimeout(() => {
        bot.activateItem(); 
      }, 1500);
    }, 5000);

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

  bot.on('windowOpen', (window) => {
    console.log('[MENU] Da mo Menu Dong ho thanh cong. Dang doi tai du lieu...');
    setTimeout(async () => {
      try {
        console.log('[LOBBY] Tien hanh click vao o so 5 (Slot 4) de vao KingSMP...');
        await bot.clickWindow(4, 0, 0); 
        console.log('[LOBBY] Da gui lenh click chuot thanh cong!');
      } catch (err) {
        console.log(`[LOBBY] Loi khi click Menu: ${err.message}`);
      }
    }, 1500);
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
