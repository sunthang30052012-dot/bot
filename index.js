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
let isMainWorld = false;

// HÀM VẼ ẢNH MINH HỌA BẰNG KÝ TỰ (ASCII ART) LÊN RENDER LOGS
function drawAsciiArt(stage) {
  if (stage === 'lobby') {
    console.log(`
    +---------------------------------------------------+

    |             [ TRANG THAI: SANH CHO ]              |
    |                                                   |
    |     [BOT] -------> [ADMIN/LOGIN]                  |
    |   (ipttdup)           (Yeu cau: /dn)              |
    |                                                   |
    |   📌 Toado hien tai: X:1  Y:41  Z:1               |
    |   ⚠️  Bot dang bi ket ngoai sảnh cho!             |
    +---------------------------------------------------+
    `);
  } else if (stage === 'farm') {
    console.log(`
    +---------------------------------------------------+

    |         🎉 [ TRANG THAI: CUM SINH TON ] 🎉       |
    |                                                   |
    |     ⚔️  [BOT] ====> 💥 [QUAI VAT]                |
    |    (ipttdup)         (Dang chem farm)             |
    |                                                   |
    |   ✅ TRANG THAI: SIEU FARM HOAT DONG 24/7         |
    |   🛸 Gui /tpahere de keo bot ve may farm ngay!    |
    +---------------------------------------------------+
    `);
  }
}

function startBot() {
  bot = mineflayer.createBot({
    host: config.host,
    username: config.username,
    version: config.version
  });

  bot.on('login', () => { 
    console.log(`[OK] Bot ${bot.username} da vao mang.`); 
    isMainWorld = false;
  });

  bot.on('spawn', () => {
    console.log('[INFO] Bot da xuat hien.');
    
    // 1. Tự động gõ lệnh đăng nhập /dn sau khi vào sảnh 2 giây
    setTimeout(() => {
      bot.chat(`/dn ${config.matkhau}`);
      console.log('[AUTH] Da tu dong go /dn.');
    }, 2000);

    // 2. MỞ MENU VÀ CLICK: Đợi hẳn 8 giây đăng nhập xong mới click vào ô số 36 (Slot 35)
    setTimeout(() => {
      if (!isMainWorld) {
        bot.setQuickBarSlot(4); // Cầm đồng hồ
        setTimeout(() => {
          bot.activateItem(); // Bấm chuột phải mở Menu
          setTimeout(async () => {
             try {
               console.log('[LOBBY] Dang click chon o so 36 (Slot ID 35) de vao KingSMP...');
               await bot.clickWindow(35, 0, 0); // Click khối vàng KingSMP
             } catch(e) { console.log(e.message); }
          }, 1500);
        }, 1000);
      }
    }, 8000);

    // 3. HỆ THỐNG KIỂM TRA ĐỒ HỌA KÝ TỰ TỰ ĐỘNG (Cứ 5 giây / 1 lần)
    if (xyzInterval) clearInterval(xyzInterval);
    xyzInterval = setInterval(() => {
      if (bot.entity && bot.entity.position) {
        const pos = bot.entity.position;
        const x = Math.round(pos.x);
        const z = Math.round(pos.z);
        
        // KIỂM TRA: Nếu tọa độ Z thoát khỏi sảnh chờ (Z > 30) thì chuyển sang tranh cụm sinh tồn
        if (z > 30 && !isMainWorld) {
           isMainWorld = true;
        }

        // Vẽ ảnh bằng ký tự tương ứng ra khung đen Render
        if (!isMainWorld) {
           drawAsciiArt('lobby');
        } else {
           drawAsciiArt('farm');
           console.log(`[CHECK XYZ] Toa do thuc te tai SMP: X: ${x} | Y: ${Math.round(pos.y)} | Z: ${z}`);
        }
      }
    }, 5000);

    // 4. CHẾ ĐỘ SIÊU FARM: Tự động chém quái vật đứng sát cạnh bot
    if (farmInterval) clearInterval(farmInterval);
    farmInterval = setInterval(() => {
      if (bot.entity && isMainWorld) { 
        const target = bot.nearestEntity((entity) => entity.type === 'mob');
        if (target) bot.attack(target); 
      }
    }, 1000); 
  });

  // 5. TỰ ĐỘNG NHẬN LỆNH DỊCH CHUYỂN /TPACCEPT
  bot.on('chat', (username, message) => {
    if (message.includes('muon dich chuyen') || message.includes('tpa') || message.includes('tpahere')) {
      setTimeout(() => {
        bot.chat('/tpaccept');
        console.log(`[TELEPORT] Da chap nhan lenh tu: ${username}`);
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
