]const mineflayer = require('mineflayer');
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
    
    // 1. Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 2 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // 2. VƯỢT SẢN CHỜ: Cầm đồng hồ ở ô số 5 (Hotbar slot 4) và click phải mở Menu
    setTimeout(() => {
      console.log('[LOBBY] Dang chuan bi mo Menu bang Dong ho...');
      bot.setQuickBarSlot(4); 
      
      setTimeout(() => {
        bot.activateItem(); 
      }, 1500);
    }, 5000);

    // 3. CHẾ ĐỘ SIÊU FARM: Tự động quét và tấn công mục tiêu đứng sát cạnh bot
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        // Quét tìm quái vật (mob) hoặc người chơi khác ở gần trong phạm vi chém
        const target = bot.nearestEntity((entity) => entity.type === 'mob' || entity.type === 'player');
        if (target) {
          bot.attack(target); // Tiến hành chém farm mục tiêu
        }
      }
    }, 1000); // Tần suất quét chém: 1 giây / 1 lần
  });

  // 4. TỰ ĐỘNG CLICK CHỌN CỤM KINGSMP KHI MENU MỞ RA (Đã sửa lỗi kẹt lặp vô hạn)
  bot.on('windowOpen', (window) => {
    console.log('[MENU] Da mo Menu Dong ho thanh cong. Dang doi tai du lieu...');
    
    // Đợi 1.5 giây sau khi mở menu rồi mới bấm chuột để server chấp nhận lệnh dịch chuyển
    setTimeout(async () => {
      try {
        console.log('[LOBBY] Tien hanh click vao o so 5 (Slot 4) de vao KingSMP...');
        await bot.clickWindow(4, 0, 0); // Bấm chuột trái trực tiếp vào khối đất KingSMP
        console.log('[LOBBY] Da gui lenh click chuot thanh cong!');
      } catch (err) {
        console.log(`[LOBBY] Loi khi click Menu: ${err.message}`);
      }
    }, 1500);
  });

  // 5. CƠ CHẾ TỰ ĐỘNG VÀO LẠI GAME KHI SERVER SẬP HOẶC BẢO TRÌ
  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
