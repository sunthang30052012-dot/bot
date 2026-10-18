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
let daVaoCumChinh = false;

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
    daVaoCumChinh = false; 
  });

  bot.on('spawn', () => {
    console.log('[INFO] Bot da xuat hien tai sanh.');
    
    // 1. Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 2 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // 2. MỞ MENU: Đợi hẳn 8 giây cho đăng nhập hoàn tất mới cầm đồng hồ mở thực đơn
    setTimeout(() => {
      if (!daVaoCumChinh) {
        console.log('[LOBBY] Dang chuan bi mo Menu bang Dong ho...');
        bot.setQuickBarSlot(4); // Cầm đồng hồ ở ô số 5 (Hotbar slot 4)
        
        setTimeout(() => {
          bot.activateItem(); // Bấm chuột phải mở thực đơn chọn cụm
        }, 1500);
      }
    }, 8000);

    // 3. CHẾ ĐỘ SIÊU FARM: Tự động quét và tấn công mục tiêu đứng sát cạnh
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

  // 4. XỬ LÝ MENU: Ép buộc click chính xác vào Slot 35 (Khối vàng KingSMP theo ảnh)
  bot.on('windowOpen', (window) => {
    if (daVaoCumChinh) return;
    console.log('[MENU] Da mo Menu Dong ho thanh cong. Dang doi tai du lieu...');

    // Đợi 2 giây cho Menu tải xong thông tin ổn định rồi mới click
    setTimeout(async () => {
      try {
        console.log('[LOBBY] Ep buoc click chuot trai vao o so 36 (Slot ID 35) de vao KingSMP...');
        daVaoCumChinh = true; // Khóa lệnh để tránh lặp lại
        
        // Thực hiện lệnh click ảo chính xác vào ô khối vàng KingSMP dựa theo ảnh chụp
        await bot.clickWindow(35, 0, 0); 
        console.log('[LOBBY] Da gui lenh click chuot trai vào o KingSMP thanh cong!');
      } catch (err) {
        console.log(`[LOBBY] Loi click Menu: ${err.message}`);
        daVaoCumChinh = false;
      }
    }, 2000);
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
