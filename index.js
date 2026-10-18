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
let xyzInterval;
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

    // 2. MỞ MENU: Đợi 8 giây cho đăng nhập hoàn tất mới cầm đồng hồ mở thực đơn
    setTimeout(() => {
      if (!daVaoCumChinh) {
        console.log('[LOBBY] Dang chuan bi mo Menu bang Dong ho...');
        bot.setQuickBarSlot(4); // Cầm đồng hồ ở ô số 5 (Hotbar slot 4)
        
        setTimeout(() => {
          bot.activateItem(); // Bấm chuột phải mở thực đơn chọn cụm
        }, 1500);
      }
    }, 8000);

    // 3. TÍNH NĂNG ĐẶC BIỆT: TỰ ĐỘNG CHECK XYZ VÀ IN LOGS LÊN RENDER
    // Cứ sau 5 giây, bot sẽ quét và in vị trí hiện tại của nó ra màn hình
    if (xyzInterval) clearInterval(xyzInterval);
    xyzInterval = setInterval(() => {
      if (bot.entity && bot.entity.position) {
        const pos = bot.entity.position;
        const currentWorld = bot.game ? bot.game.dimension : 'Unkown';
        // In ra màn hình ảo tọa độ X, Y, Z làm tròn số cho dễ nhìn
        console.log(`[CHECK XYZ] Vi tri hien tai: X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)} | Z: ${Math.round(pos.z)} | The gioi: ${currentWorld}`);
      }
    }, 5000);

    // 4. CHẾ ĐỘ SIÊU FARM: Tự động quét và tấn công mục tiêu đứng sát cạnh
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

  // 5. XỬ LÝ MENU: Ép buộc click chính xác vào Slot 35 (Khối vàng KingSMP theo ảnh thực tế)
  bot.on('windowOpen', (window) => {
    if (daVaoCumChinh) return;
    console.log('[MENU] Da mo Menu Dong ho thanh cong. Dang doi tai du lieu...');

    setTimeout(async () => {
      try {
        console.log('[LOBBY] Ep buoc click chuot trai vao o so 36 (Slot ID 35) de vao KingSMP...');
        daVaoCumChinh = true; // Khóa lệnh để tránh lặp lại
        
        await bot.clickWindow(35, 0, 0); // Click chuột trái trúng khối vàng KingSMP
        console.log('[LOBBY] Da gui lenh click chuot trai vao o KingSMP thanh cong!');
      } catch (err) {
        console.log(`[LOBBY] Loi click Menu: ${err.message}`);
        daVaoCumChinh = false;
      }
    }, 2000);
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    clearInterval(xyzInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
