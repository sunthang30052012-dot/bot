// ============================================================
// index.js - FULL 1 FILE: Bot + Web Panel + Màn hình 2D mô phỏng 3D + Radar
// ============================================================
const mineflayer = require('mineflayer');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.json());

const config = {
  host: 'kingmc.vn',
  username: 'ipttdup',
  version: '1.20.1'
};

let bot = null;
let farmInterval = null;
let randomMoveInterval = null;
let xyzInterval = null;
let screenInterval = null;
let botStatus = "Chưa kết nối";
let currentXYZ = "X: 0 | Y: 0 | Z: 0";
let isRandomMoving = false;

// ------------------------------------------------------------
// MÀN HÌNH 1: MÔ PHỎNG 3D GÓC NHÌN NGƯỜI CHƠI (bắn tia bằng ký tự)
// ------------------------------------------------------------
const VIEW_W = 56;                     // số cột
const VIEW_H = 20;                     // số hàng
const FOV_H = 80 * Math.PI / 180;      // góc nhìn ngang
const FOV_V = FOV_H * (VIEW_H / VIEW_W) * 2; // ký tự cao gấp ~2 lần rộng
const MAX_DIST = 15;                   // nhìn xa tối đa (block)
const STEP = 0.35;                     // bước tia
const WALL_CHARS = '@#%*=-:.';         // gần -> xa (mặt đứng)
const FLOOR_CHARS = '%*+=-:,.';        // gần -> xa (nền / trần)

function shade(chars, dist) {
  const i = Math.min(chars.length - 1, Math.floor((dist / MAX_DIST) * chars.length));
  return chars[i];
}

function renderView(b) {
  if (!b || !b.entity) return 'Bot chưa vào game...';
  const eye = b.entity.position.offset(0, 1.62, 0);
  const yaw = b.entity.yaw;
  const pitch = b.entity.pitch;
  const lines = [];

  for (let r = 0; r < VIEW_H; r++) {
    const rp = pitch + (0.5 - (r + 0.5) / VIEW_H) * FOV_V;
    const cp = Math.cos(rp);
    const dy = Math.sin(rp);
    let line = '';

    for (let c = 0; c < VIEW_W; c++) {
      const a = ((c + 0.5) / VIEW_W - 0.5) * FOV_H;
      const ry = yaw - a;
      const dx = -Math.sin(ry) * cp;
      const dz = -Math.cos(ry) * cp;

      let ch = ' ';
      let pfx = Math.floor(eye.x), pfy = Math.floor(eye.y), pfz = Math.floor(eye.z);

      for (let d = STEP; d <= MAX_DIST; d += STEP) {
        const blk = b.blockAt(eye.offset(dx * d, dy * d, dz * d));
        if (!blk) continue;

        const fx = Math.floor(eye.x + dx * d);
        const fy = Math.floor(eye.y + dy * d);
        const fz = Math.floor(eye.z + dz * d);

        if (blk.name.includes('water')) { ch = '~'; break; }
        if (blk.name.includes('lava')) { ch = '!'; break; }
        if (blk.boundingBox === 'block') {
          const isFlatFace = (fy !== pfy && fx === pfx && fz === pfz);
          ch = isFlatFace ? shade(FLOOR_CHARS, d) : shade(WALL_CHARS, d);
          break;
        }
        pfx = fx; pfy = fy; pfz = fz;
      }
      line += ch;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

// ------------------------------------------------------------
// MÀN HÌNH 2: RADAR NHÌN TỪ TRÊN XUỐNG
// ------------------------------------------------------------
const RADIUS = 8; // 8 => lưới 17x17

function blockChar(name) {
  if (name.includes('water')) return '~';
  if (name.includes('lava')) return '!';
  if (name.includes('leaves')) return '%';
  if (name.includes('log') || name.includes('wood')) return '|';
  if (name.includes('sand')) return ':';
  if (name.includes('snow') || name.includes('ice')) return '*';
  if (name.includes('grass') || name.includes('fern')) return '.';
  if (name.includes('dirt') || name.includes('path') || name.includes('mud')) return ',';
  if (name.includes('stone') || name.includes('deepslate') || name.includes('ore')) return '=';
  return '+';
}

function topBlock(b, base, dx, dz) {
  for (let dy = 3; dy >= -4; dy--) {
    const blk = b.blockAt(base.offset(dx, dy, dz));
    if (blk && blk.name !== 'air' && blk.name !== 'cave_air' && blk.name !== 'void_air') {
      return { block: blk, dy };
    }
  }
  return null;
}

function facing(yaw) {
  const deg = ((yaw * 180) / Math.PI + 360) % 360;
  const dirs = ['Bắc', 'Tây', 'Nam', 'Đông'];
  return dirs[Math.round(deg / 90) % 4];
}

function renderRadar(b) {
  if (!b || !b.entity) return 'Bot chưa vào game...';
  const base = b.entity.position.floored();

  const marks = new Map();
  for (const id in b.entities) {
    const e = b.entities[id];
    if (!e || e === b.entity || !e.position) continue;
    const dx = Math.floor(e.position.x) - base.x;
    const dz = Math.floor(e.position.z) - base.z;
    if (Math.abs(dx) > RADIUS || Math.abs(dz) > RADIUS) continue;
    if (e.type === 'player') marks.set(dx + ',' + dz, 'P');
    else if (e.type === 'mob' || e.type === 'hostile') marks.set(dx + ',' + dz, 'M');
  }

  const lines = [];
  for (let dz = -RADIUS; dz <= RADIUS; dz++) {
    const row = [];
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      let ch;
      if (dx === 0 && dz === 0) ch = '@';
      else if (marks.has(dx + ',' + dz)) ch = marks.get(dx + ',' + dz);
      else {
        const t = topBlock(b, base, dx, dz);
        if (!t) ch = ' ';
        else if (t.dy >= 1 && !t.block.name.includes('water')) ch = '#';
        else ch = blockChar(t.block.name);
      }
      row.push(ch);
    }
    lines.push(row.join(' '));
  }

  const header = 'Hướng nhìn: ' + facing(b.entity.yaw) + '  |  Bắc ↑\n';
  const legend = '\n@ Bot  P Người  M Mob  # Tường  . Cỏ  , Đất  = Đá  ~ Nước  ! Dung nham  | Gỗ  % Lá  : Cát';
  return header + lines.join('\n') + legend;
}

// ------------------------------------------------------------
// GIAO DIỆN WEB PANEL
// ------------------------------------------------------------
function getHtmlPage(cfg, status, xyz) {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Minecraft Bot Ultimate Control Panel</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #121212; color: #fff; margin: 0; padding: 20px; display: flex; justify-content: center; }
            .wrapper { display: grid; grid-template-columns: 450px 450px; gap: 20px; background: #1e1e1e; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); align-items: start; max-width: 950px; width: 100%; box-sizing: border-box; }
            .panel { background: #252525; padding: 20px; border-radius: 10px; box-sizing: border-box; }
            .right-container { display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; }
            .chat-container,
