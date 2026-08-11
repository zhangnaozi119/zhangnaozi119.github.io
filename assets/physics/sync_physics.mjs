#!/usr/bin/env node
/**
 * sync_physics.mjs — 把「每日趣味物理」生成的 quiz_data_YYYY-MM-DD.json
 * 同步进「快快长脑子」网站的「学习长脑子 → 物理问答」子模块。
 *
 * 用法：
 *   node sync_physics.mjs <quiz_data_路径> [commit备注]
 *
 * 实现说明（为什么用 GitHub API 而不是 git push）：
 *  - 本机 git 全局有 url.https://codeload.github.com/.insteadOf=https://github.com/，
 *    会把所有 github.com 操作偷偷改到 codeload，而 codeload 不接受写操作 → 404。
 *  - 因此这里改用 GitHub REST API（PUT /repos/{owner}/{repo}/contents/{path}）上传文件，
 *    完全绕过 git 的 insteadOf，Node 的 fetch 直接打 api.github.com，最稳。
 *  - 本地同时写入 site/assets/physics/ 以备离线预览；token 读取自 C:/Users/K/WorkBuddy/site_gh_pat.txt。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 清掉可能继承的代理环境变量，让 Node fetch 直连 api.github.com
['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']
  .forEach((k) => { delete process.env[k]; });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(__dirname, '..', '..');          // site/
const PHYS_DIR = path.join(SITE_ROOT, 'assets', 'physics');
const ISSUES_DIR = path.join(PHYS_DIR, 'issues');
const MANIFEST = path.join(PHYS_DIR, 'manifest.json');
const TOKEN_FILE = 'C:/Users/K/WorkBuddy/site_gh_pat.txt';
const REPO = 'zhangnaozi119/zhangnaozi119.github.io';
const API = 'https://api.github.com';

function die(msg) { console.error('[sync_physics] ' + msg); process.exit(1); }

// ---- 入参 ----
const quizPath = process.argv[2];
if (!quizPath) die('缺少参数：quiz_data_YYYY-MM-DD.json 路径');
if (!fs.existsSync(quizPath)) die('找不到文件：' + quizPath);
const commitMsg = process.argv[3] || ('feat(physics): ' + path.basename(quizPath));

let data;
try { data = JSON.parse(fs.readFileSync(quizPath, 'utf8')); }
catch (e) { die('JSON 解析失败：' + e.message); }

// ---- 提取日期 ----
let dateStr = null;
const m = path.basename(quizPath).match(/(\d{4})-(\d{2})-(\d{2})/);
if (m) dateStr = `${m[1]}-${m[2]}-${m[3]}`;
else if (data.date) {
  const dm = String(data.date).match(/(\d{1,2})月(\d{1,2})日/);
  if (dm) {
    const y = new Date().getFullYear();
    dateStr = `${y}-${String(dm[1]).padStart(2, '0')}-${String(dm[2]).padStart(2, '0')}`;
  }
}
if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);

// ---- 写本地 issue 文件 ----
fs.mkdirSync(ISSUES_DIR, { recursive: true });
const issueRel = 'assets/physics/issues/' + dateStr + '.json';
const issuePath = path.join(SITE_ROOT, issueRel);
fs.writeFileSync(issuePath, JSON.stringify(data, null, 2), 'utf8');

// ---- 更新本地 manifest ----
let manifest = { latest: dateStr, issues: [] };
if (fs.existsSync(MANIFEST)) {
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) {}
  if (!Array.isArray(manifest.issues)) manifest.issues = [];
}
const title = data.date ? String(data.date).replace(/日$/, '日') : dateStr;
const idx = manifest.issues.findIndex((it) => it.date === dateStr);
const entry = { date: dateStr, title: title, file: issueRel };
if (idx >= 0) manifest.issues[idx] = entry;
else manifest.issues.push(entry);
manifest.issues.sort((a, b) => (a.date < b.date ? 1 : -1));
manifest.latest = manifest.issues[0].date;
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), 'utf8');
console.log('[sync_physics] 本地写入完成，共 ' + manifest.issues.length + ' 期，最新 ' + manifest.latest);

// ---- 经 GitHub API 推送 ----
const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
if (!token) die('未找到 GitHub token（请写入 ' + TOKEN_FILE + '）');

async function putContents(repoPath, content, message) {
  const url = `${API}/repos/${REPO}/contents/${repoPath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'sync-physics',
  };
  let sha = null;
  try {
    const r = await fetch(url, { headers });
    if (r.status === 200) { const j = await r.json(); sha = j.sha; }
  } catch (e) { /* 新文件，无 sha */ }

  const body = { message, content: Buffer.from(content, 'utf8').toString('base64') };
  if (sha) body.sha = sha;
  const r = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    die('API 失败 ' + r.status + ' ' + repoPath + '：' + t.slice(0, 240));
  }
  console.log('[sync_physics] 已上传 ' + repoPath);
}

await putContents(issueRel, fs.readFileSync(issuePath, 'utf8'), `feat(physics): ${dateStr}`);
await putContents('assets/physics/manifest.json', fs.readFileSync(MANIFEST, 'utf8'), `chore(physics): manifest ${dateStr}`);
console.log('[sync_physics] ✅ 已同步到网站（GitHub Pages 稍后自动构建）');
