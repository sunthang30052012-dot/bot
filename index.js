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
    console.log('[INFO] Bot da xuat hien.');
    
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

    // 3. TỰ ĐỘNG CHECK XYZ IN LOGS RENDER (Cứ 5 giây/lần)
    if (xyzInterval) clearInterval(xyzInterval);
    xyzInterval = setInterval(() => {
      if (bot.entity && bot.entity.position) {
        const pos = bot.entity.position;
        console.log(`[CHECK XYZ] X: ${Math.round(pos.x)} | Y: ${Math.round(pos.y)} | Z: ${Math.round(pos.z)}`);
      }
    }, 5000);

    // 4. CHẾ ĐỘ SIÊU FARM: Tự động quét và tấn công quái vật đứng sát cạnh bot
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity) {
        const target = bot.nearestEntity((entity) => entity.type === 'mob');
        if (target) {
          bot.attack(target); // Tự động vung tay chém quái rơi ở máy farm
        }
      }
    }, 1000); 
  });

  // 5. XỬ LÝ MENU: Ép buộc click chính xác vào Slot 35 để vào KingSMP
  bot.on('windowOpen', (window) => {
    if (daVaoCumChinh) return;
    console.log('[MENU] Da mo Menu Dong ho thanh cong. Dang doi tai du lieu...');

    setTimeout(async () => {
      try {
        console.log('[LOBBY] Ep buoc click chuot trai vao o so 36 (Slot ID 35) de vao KingSMP...');
        daVaoCumChinh = true; 
        await bot.clickWindow(35, 0, 0); 
        console.log('[LOBBY] Da gui lenh click chuot trai vao o KingSMP thanh cong!');
      } catch (err) {
        console.log(`[LOBBY] Loi click Menu: ${err.message}`);
        daVaoCumChinh = false;
      }
    }, 2000);
  });

  // 6. TÍNH NĂNG ĐẶC BIỆT: TỰ ĐỘNG CHẤP NHẬN DỊCH CHUYỂN (/tpaccept)
  // Bất kỳ ai gửi lệnh dịch chuyển tới, bot sẽ tự gõ /tpaccept sau 2 giây
  bot.on('chat', (username, message) => {
    if (message.includes('muốn dịch chuyển') || message.includes('tpa') || message.includes('tpahere')) {
      setTimeout(() => {
        bot.chat('/tpaccept');
        console.log(`[TELEPORT] Da tu dong chap nhan lenh dich chuyen tu: ${username}`);
      }, 2000);
    }
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
