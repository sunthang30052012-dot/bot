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
let daVaoCumChinh = false; // Biến khóa bảo vệ chống lặp lại

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

  // 4. BỘ DÒ Ô THÔNG MINH: Tự quét tên vật phẩm chứa chữ "King" để click
  bot.on('windowOpen', (window) => {
    if (daVaoCumChinh) return; // Đã vào cụm chính rồi thì không bấm lại nữa
    console.log('[MENU] Da mo Menu Dong ho. Dang quet tim cum KingSMP...');

    setTimeout(async () => {
      // Quét tìm tất cả các ô để xem ô nào có tên chứa chữ "king" hoặc "smp"
      let foundSlot = null;
      for (const slot of window.slots) {
        if (slot && slot.displayName) {
          const name = slot.displayName.toLowerCase();
          if (name.includes('king') || name.includes('smp')) {
            foundSlot = slot.slot;
            console.log(`[LOBBY] Da do thay cum tai o so (Slot ID): ${slot.slot} - Ten: ${slot.displayName}`);
            break;
          }
        }
      }

      // Thực hiện lệnh click ảo dựa trên kết quả dò được
      try {
        if (foundSlot !== null) {
          daVaoCumChinh = true; // Khóa lệnh để tránh lặp
          await bot.clickWindow(foundSlot, 0, 0); // Click chuột trái vào ô chuẩn
          console.log('[LOBBY] Da click o do tim duoc. Dang chuyen server...');
        } else {
          // Nếu hệ thống ẩn tên, ép buộc click thử ô trung tâm số 13 hoặc ô số 4
          console.log('[LOBBY] Khong do duoc ten, click thu o mac dinh trung tam...');
          daVaoCumChinh = true;
          await bot.clickWindow(4, 0, 0); 
        }
      } catch (err) {
        console.log(`[LOBBY] Loi click Menu: ${err.message}`);
        daVaoCumChinh = false; // Reset nếu click lỗi để bot thử lại
      }
    }, 2000); // Trễ 2 giây chờ thực đơn load xong văn bản màu của vật phẩm
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
