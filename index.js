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
let hasClicked = false; // Biến chặn bot không bị click lặp đi lặp lại vô hạn

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
    hasClicked = false; // Reset trạng thái click khi đăng nhập mới
  });

  bot.on('spawn', () => {
    console.log('[INFO] Bot da xuat hien tai sanh.');
    
    // 1. Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 3 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 3000);

    // 2. MỞ MENU ĐỒNG HỒ: Đợi hẳn 8 giây để đăng nhập xong hoàn toàn rồi mới cầm đồng hồ mở menu
    setTimeout(() => {
      if (!hasClicked) {
        console.log('[LOBBY] Dang chuan bi mo Menu bang Dong ho...');
        bot.setQuickBarSlot(4); // Cầm đồng hồ ở ô số 5 (Hotbar slot 4)
        
        setTimeout(() => {
          bot.activateItem(); // Bấm chuột phải mở Menu ảo
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

  // 4. TỰ ĐỘNG THÔNG MINH QUÉT TÌM Ô CHỨA CHỮ "KING" ĐỂ CLICK TRÁI VÀO CỤM SERVER
  bot.on('windowOpen', (window) => {
    if (hasClicked) return; // Nếu đã click rồi thì bỏ qua, chặn vòng lặp vô hạn mở menu
    console.log('[MENU] Da mo Menu Dong ho. Dang quet tim cum KingSMP...');

    setTimeout(async () => {
      // Quét tất cả các ô trong menu để tìm vật phẩm có tên chứa chữ "King" hoặc "SMP"
      const targetSlot = window.slots.find(slot => 
        slot && (
          (slot.displayName && slot.displayName.toLowerCase().includes('king')) ||
          (slot.name && slot.name.toLowerCase().includes('grass')) || // Thử tìm theo khối cỏ/đất
          (slot.customName && slot.customName.toLowerCase().includes('king'))
        )
      );

      if (targetSlot) {
        console.log(`[LOBBY] Đã tìm thấy cụm tại ô số ${targetSlot.slot}. Dang click...`);
        hasClicked = true; // Đánh dấu đã click thành công
        await bot.clickWindow(targetSlot.slot, 0, 0); // Click chuột trái ảo
        console.log('[LOBBY] Đã di chuyển sang KingSMP thành công!');
      } else {
        // Nếu không quét được tên do server ẩn, ép buộc click thử ô trung tâm số 13 (Hàng 2 ô số 5) hoặc ô số 4
        console.log('[LOBBY] Không dò được tên vật phẩm, tiến hành click ép buộc ô trung tâm...');
        hasClicked = true;
        await bot.clickWindow(13, 0, 0); 
      }
    }, 2000); // Delay 2 giây đợi thực đơn tải xong dữ liệu tên vật phẩm ổn định
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mat ket noi: ${reason}. Vao lai sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LOI] ${err.message}`); });
}

startBot();
