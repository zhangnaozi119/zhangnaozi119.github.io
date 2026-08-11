#!/usr/bin/env node
/**
 * sync_physics.mjs — 把「每日趣味物理」生成的 quiz_data_YYYY-MM-DD.json
 * 同步进「快快长脑子」网站的「学习长脑子 → 物理问答」子模块，并 git push。
 *
 * 用法：
 *   node sync_physics.mjs <quiz_data_路径> [commit备注]
 *
 * 说明：
 *  - 脚本位于 site/assets/physics/，自动以自身所在仓库根（site/）为工作目录。
 *  - 日期从文件名 quiz_data_YYYY-MM-DD.json 提取，回退到 JSON 的 date 字段 / 当天。
 *  - 写入 site/assets/physics/issues/<date>.json，并更新 manifest.json（按日期倒序）。
 *  - push 使用 token：优先环境变量 GH_PAT，其次读取 C:/Users/K/WorkBuddy/site_gh_pat.txt。
 *    必要时走代理 http://127.0.0.1:7892（沙箱出网受限时），失败自动回退直连。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..');          // site/
const PHYS_DIR = path.join(SITE_ROOT, 'assets', 'physics');
const ISSUES_DIR = path.join(PHYS_DIR, 'issues');
const MANIFEST = path.join(PHYS_DIR, 'manifest.json');
const TOKEN_FILE = 'C:/Users/K/WorkBuddy/site_gh_pat.txt';
const REMOTE = 'https://github.com/zhangnaozi119/zhangnaozi119.github.io.git';

function die(msg) { console.error('[sync_physics] ' + msg); process.exit(1); }

// ---- 解析入参 ----
const quizPath = process.argv[2];
if (!quizPath) die('缺少参数：quiz_data_YYYY-MM-DD.json 路径');
if (!fs.existsSync(quizPath)) die('找不到文件：' + quizPath);
const commitMsg = process.argv[3] || ('chore: sync physics ' + path.basename(quizPath));

// ---- 提取日期 ----
const m = path.basename(quizPath).match(/(\d{4})-(\d{2})-(\d{2})/);
let dateStr = m ? `${m[1]}-${m[2]}-${m[3]}` : null;
let data;
try { data = JSON.parse(fs.readFileSync(quizPath, 'utf8')); }
catch (e) { die('JSON 解析失败：' + e.message); }
if (!dateStr && data.date) {
  const dm = String(data.date).match(/(\d{1,2})月(\d{1,2})日/);
  if (dm) {
    const y = new Date().getFullYear();
    dateStr = `${y}-${String(dm[1]).padStart(2, '0')}-${String(dm[2]).padStart(2, '0')}`;
  }
}
if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);

// ---- 写入本期 issue ----
fs.mkdirSync(ISSUES_DIR, { recursive: true });
const issueFile = path.join(ISSUES_DIR, dateStr + '.json');
fs.writeFileSync(issueFile, JSON.stringify(data, null, 2), 'utf8');
const relFile = 'assets/physics/issues/' + dateStr + '.json';
console.log('[sync_physics] 写入 ' + relFile);

// ---- 更新 manifest ----
let manifest = { latest: dateStr, issues: [] };
if (fs.existsSync(MANIFEST)) {
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) {}
  if (!Array.isArray(manifest.issues)) manifest.issues = [];
}
const title = data.date ? String(data.date).replace(/日$/, '日') : dateStr;
const idx = manifest.issues.findIndex((it) => it.date === dateStr);
const entry = { date: dateStr, title: title, file: relFile };
if (idx >= 0) manifest.issues[idx] = entry;
else manifest.issues.push(entry);
manifest.issues.sort((a, b) => (a.date < b.date ? 1 : -1));
manifest.latest = manifest.issues[0].date;
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
console.log('[sync_physics] manifest 更新，共 ' + manifest.issues.length + ' 期，最新 ' + manifest.latest);

// ---- git commit + push ----
function getToken() {
  if (process.env.GH_PAT) return process.env.GH_PAT;
  try { return fs.readFileSync(TOKEN_FILE, 'utf8').trim(); } catch (e) { return ''; }
}
const token = getToken();
if (!token) die('未找到 GitHub token（请设置环境变量 GH_PAT 或在 ' + TOKEN_FILE + ' 写入）');

const authRemote = REMOTE.replace('https://', 'https://zhangnaozi119:' + token + '@');

// 全局有 url.https://codeload.github.com/.insteadOf=https://github.com/
// 会把所有 github.com 操作偷偷改到 codeload（codeload 不接受写操作 → 404）。
// 这里用一条反向 insteadOf 把它再绕回真正的 github.com。
const INSTEADOF = '-c url.https://github.com/.insteadOf=https://codeload.github.com/';

function git(args, proxy) {
  const env = { ...process.env };
  if (proxy) {
    env.http_proxy = proxy; env.https_proxy = proxy;
    env.HTTP_PROXY = proxy; env.HTTPS_PROXY = proxy;
    env.ALL_PROXY = proxy; env.all_proxy = proxy;
  } else {
    // 真正清空可能的代理环境变量，避免继承到系统代理
    ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'all_proxy'].forEach((k) => { delete env[k]; });
    args = '-c http.proxy= -c https.proxy= ' + args;
  }
  return execSync('git ' + INSTEADOF + ' ' + args, { cwd: SITE_ROOT, env, stdio: 'inherit' });
}

try {
  git('add -A', '');
  try { execSync('git -C ' + JSON.stringify(SITE_ROOT) + ' ' + INSTEADOF + ' commit -q -m ' + JSON.stringify(commitMsg), { stdio: 'inherit' }); }
  catch (e) { console.log('[sync_physics] 无新提交（内容未变）'); }

  // 推送策略：先试代理 7892（用户本机常开），失败再直连，直连因沙箱网络较抖多重试几次
  const strategies = [
    { proxy: 'http://127.0.0.1:7892', tries: 2 },
    { proxy: '', tries: 6 }
  ];
  let pushed = false;
  for (const s of strategies) {
    for (let i = 1; i <= s.tries && !pushed; i++) {
      try {
        git('push ' + JSON.stringify(authRemote) + ' main', s.proxy);
        pushed = true;
      } catch (e) {
        console.error('[sync_physics] push 失败（proxy=' + (s.proxy || 'none') + ' 第' + i + '次）：' + e.message.split('\n')[0]);
      }
    }
    if (pushed) break;
  }
  if (!pushed) die('git push 失败，请检查网络 / token');
  console.log('[sync_physics] 已推送 ✅');
} catch (e) {
  die('git 操作失败：' + e.message);
}
