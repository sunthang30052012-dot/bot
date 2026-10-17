const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

app.get('/', (req, res) => { res.send('Bot KingMC đang hoạt động!'); });
app.listen(process.env.PORT || 3000, () => { console.log('Web server đã sẵn sàng.'); });

// === ĐIỀN THÔNG TIN SERVER VÀ TÀI KHOẢN CỦA BẠN ===
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
    console.log(`[OK] Bot ${bot.username} đã vào mạng.`); 
  });

  // Tự động xử lý đăng nhập và vượt sảnh chờ khi hồi sinh
  bot.on('spawn', () => {
    console.log('[INFO] Bot đã xuất hiện tại sảnh.');
    
    // 1. Tự động gõ lệnh đăng nhập /dn ngay khi vào
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Đã tự động gõ /dn.');
    }, 2000);

    // 2. VƯỢT SẢN CHỜ: Cầm đồng hồ ở ô số 5 và bấm chuột phải để mở Menu
    setTimeout(() => {
      console.log('[LOBBY] Đang chuẩn bị mở Menu bằng Đồng hồ...');
      bot.setQuickBarSlot(4); // Cầm vật phẩm ở ô thứ 5 trên thanh công cụ (Hotbar slot 4)
      
      setTimeout(() => {
        bot.activateItem(); // Bấm chuột phải để kích hoạt mở Menu Đồng hồ
      }, 1500);
    }, 5000);

    // 3. KÍCH HOẠT CHẾ ĐỘ SIÊU FARM (Chỉ chạy sau khi đã vào được thế giới chính)
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        bot.swingHand(); // Tự động vung tay chém liên tục để farm
      }
    }, 1000); // 1 giây chém 1 lần
  });

  // 4. TỰ ĐỘNG CLICK VÀO KHỐI ĐẤT/CỎ KHI MENU ĐỒNG HỒ MỞ RA
  bot.on('windowOpen', async (window) => {
    console.log('[MENU] Đã mở Menu Đồng hồ thành công.');
    
    // Tìm ô có chứa chữ "KingSMP" để bấm chọn vào cụm server chính
    const item = window.slots.find(slot => slot && slot.displayName && slot.displayName.includes('King'));
    
    if (item) {
      console.log(`[LOBBY] Đang click chọn cụm: ${item.displayName}`);
      await bot.clickWindow(item.slot, 0, 0); // Click chuột trái vào ô đó
    } else {
      // Nếu không tìm thấy tên chính xác, tự động click vào ô số 4 (dòng đầu, cột thứ 5)
      console.log('[LOBBY] Tự động chọn ô mặc định trong Menu...');
      await bot.clickWindow(4, 0, 0); 
    }
  });

  bot.on('end', (reason) => {
    console.log(`[RECONNECT] Mất kết nối: ${reason}. Vào lại sau 30s...`);
    clearInterval(farmInterval);
    setTimeout(startBot, 30000);
  });
  
  bot.on('error', (err) => { console.log(`[LỖI] ${err.message}`); });
}

startBot();
