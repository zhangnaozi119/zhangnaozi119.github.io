/* 游戏长脑子 · 四个小游戏 */
(function () {
  'use strict';

  /* =========================================================
     1. 记忆翻牌
     ========================================================= */
  (function memory() {
    var ICONS = ['🚀', '🐙', '🍉', '🎧', '🦖', '🌈', '⚽', '🧊'];
    var grid = document.getElementById('memoGrid');
    var stepsEl = document.getElementById('memoSteps');
    var timeEl = document.getElementById('memoTime');
    var bestEl = document.getElementById('memoBest');
    var fb = document.getElementById('memoFb');
    if (!grid) return;

    var first = null, lock = false, steps = 0, matched = 0, timer = null, sec = 0, started = false;

    function showBest() {
      var b = BrainStore.get('memo.best', null);
      bestEl.textContent = b === null ? '—' : b + ' 步';
    }

    function tick() {
      sec++; timeEl.textContent = sec;
    }

    function reset() {
      clearInterval(timer); timer = null; started = false;
      sec = 0; steps = 0; matched = 0; first = null; lock = false;
      stepsEl.textContent = '0'; timeEl.textContent = '0';
      fb.textContent = ''; fb.className = 'feedback center';
      grid.innerHTML = '';

      shuffle(ICONS.concat(ICONS)).forEach(function (icon) {
        var c = document.createElement('div');
        c.className = 'memo-card';
        c.dataset.icon = icon;
        c.textContent = icon;
        c.addEventListener('click', function () { flip(c); });
        grid.appendChild(c);
      });
      showBest();
    }

    function flip(c) {
      if (lock || c.classList.contains('flip') || c.classList.contains('done')) return;
      if (!started) { started = true; timer = setInterval(tick, 1000); }
      c.classList.add('flip');

      if (!first) { first = c; return; }

      steps++; stepsEl.textContent = steps;

      if (first.dataset.icon === c.dataset.icon) {
        first.classList.add('done'); c.classList.add('done');
        first = null; matched++;
        if (matched === ICONS.length) win();
      } else {
        lock = true;
        var a = first, b = c; first = null;
        setTimeout(function () {
          a.classList.remove('flip'); b.classList.remove('flip'); lock = false;
        }, 620);
      }
    }

    function win() {
      clearInterval(timer);
      var isBest = BrainStore.best('memo.best', steps, true);
      showBest();
      fb.className = 'feedback center ok';
      fb.textContent = '🎉 全部配对成功！用了 ' + steps + ' 步、' + sec + ' 秒。' +
        (isBest ? ' 破纪录啦！' : ' 最少理论步数是 8 步哦。');
    }

    document.getElementById('memoNew').onclick = reset;
    reset();
  })();

  /* =========================================================
     2. 舒尔特方格
     ========================================================= */
  (function schulte() {
    var grid = document.getElementById('scGrid');
    var nextEl = document.getElementById('scNext');
    var timeEl = document.getElementById('scTime');
    var bestEl = document.getElementById('scBest');
    var sizeSel = document.getElementById('scSize');
    var fb = document.getElementById('scFb');
    if (!grid) return;

    var n = 4, want = 1, t0 = 0, raf = null, running = false;

    function showBest() {
      var b = BrainStore.get('sc.best.' + n, null);
      bestEl.textContent = b === null ? '—' : b.toFixed(1) + 's';
    }

    function loop() {
      timeEl.textContent = ((performance.now() - t0) / 1000).toFixed(1);
      raf = requestAnimationFrame(loop);
    }

    function reset() {
      n = parseInt(sizeSel.value, 10);
      cancelAnimationFrame(raf); running = false;
      want = 1; nextEl.textContent = '1'; timeEl.textContent = '0.0';
      fb.textContent = '点「1」开始计时'; fb.className = 'feedback center';
      grid.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
      grid.style.maxWidth = Math.min(n * 74, 420) + 'px';
      grid.innerHTML = '';

      var nums = []; for (var i = 1; i <= n * n; i++) nums.push(i);
      shuffle(nums).forEach(function (v) {
        var b = document.createElement('button');
        b.textContent = v;
        b.style.fontSize = n > 5 ? '15px' : (n > 4 ? '17px' : '20px');
        b.onclick = function () { hit(b, v); };
        grid.appendChild(b);
      });
      showBest();
    }

    function hit(btn, v) {
      if (v !== want) {
        btn.classList.add('miss');
        setTimeout(function () { btn.classList.remove('miss'); }, 260);
        fb.className = 'feedback center no';
        fb.textContent = '要按顺序哦，现在该点 ' + want;
        return;
      }
      if (v === 1) { t0 = performance.now(); running = true; loop(); fb.textContent = ''; fb.className = 'feedback center'; }
      btn.classList.add('hit');
      btn.disabled = true;
      want++;
      nextEl.textContent = want > n * n ? '✓' : want;

      if (want > n * n) {
        cancelAnimationFrame(raf); running = false;
        var used = (performance.now() - t0) / 1000;
        timeEl.textContent = used.toFixed(1);
        var isBest = BrainStore.best('sc.best.' + n, Math.round(used * 10) / 10, true);
        showBest();
        fb.className = 'feedback center ok';
        fb.textContent = '🎉 完成！' + used.toFixed(1) + ' 秒' + (isBest ? '，新纪录！' : '');
      }
    }

    sizeSel.onchange = reset;
    document.getElementById('scNew').onclick = reset;
    reset();
  })();

  /* =========================================================
     3. 24 点
     ========================================================= */
  (function game24() {
    var numsEl = document.getElementById('p24Nums');
    var input = document.getElementById('p24Input');
    var fb = document.getElementById('p24Fb');
    var scoreEl = document.getElementById('p24Score');
    var streakEl = document.getElementById('p24Streak');
    if (!numsEl) return;

    var cur = [], score = 0, streak = 0, solved = false;
    var EPS = 1e-6;

    /* 求解：返回一个可行表达式字符串，无解返回 null */
    function solve(nums) {
      var items = nums.map(function (v) { return { v: v, s: String(v) }; });
      return search(items);
    }

    function search(items) {
      if (items.length === 1) {
        return Math.abs(items[0].v - 24) < EPS ? items[0].s : null;
      }
      for (var i = 0; i < items.length; i++) {
        for (var j = 0; j < items.length; j++) {
          if (i === j) continue;
          var rest = [];
          for (var k = 0; k < items.length; k++) if (k !== i && k !== j) rest.push(items[k]);
          var a = items[i], b = items[j];
          var cands = [
            { v: a.v + b.v, s: '(' + a.s + '+' + b.s + ')' },
            { v: a.v - b.v, s: '(' + a.s + '-' + b.s + ')' },
            { v: a.v * b.v, s: '(' + a.s + '*' + b.s + ')' }
          ];
          if (Math.abs(b.v) > EPS) cands.push({ v: a.v / b.v, s: '(' + a.s + '/' + b.s + ')' });
          for (var c = 0; c < cands.length; c++) {
            var r = search(rest.concat([cands[c]]));
            if (r) return r;
          }
        }
      }
      return null;
    }

    function gen() {
      var tries = 0, nums, sol;
      do {
        nums = [randInt(1, 10), randInt(1, 10), randInt(1, 10), randInt(1, 10)];
        sol = solve(nums);
        tries++;
      } while (!sol && tries < 400);
      cur = nums;
      cur.solution = sol;
      solved = false;

      numsEl.innerHTML = '';
      nums.forEach(function (v) {
        var d = document.createElement('div');
        d.className = 'num-chip';
        d.textContent = v;
        numsEl.appendChild(d);
      });
      input.value = '';
      fb.textContent = ''; fb.className = 'feedback';
      input.focus();
    }

    function check() {
      var raw = (input.value || '').trim()
        .replace(/×/g, '*').replace(/÷/g, '/')
        .replace(/（/g, '(').replace(/）/g, ')')
        .replace(/－/g, '-').replace(/＋/g, '+');

      if (!raw) { say('no', '先写个算式吧，比如 (6+6)*(3-1)'); return; }
      if (!/^[0-9+\-*/() .]+$/.test(raw)) { say('no', '只能用数字和 + - * / ( ) 哦'); return; }

      var used = (raw.match(/\d+/g) || []).map(Number).sort(function (a, b) { return a - b; });
      var need = cur.slice().sort(function (a, b) { return a - b; });
      if (used.length !== 4 || used.join(',') !== need.join(',')) {
        say('no', '四个数字要各用一次：' + cur.join('、'));
        return;
      }

      var val;
      try { val = Function('"use strict";return (' + raw + ')')(); }
      catch (e) { say('no', '算式写得不太对，检查一下括号'); return; }

      if (typeof val !== 'number' || !isFinite(val)) { say('no', '算不出来，是不是除以 0 了？'); return; }

      if (Math.abs(val - 24) < 1e-6) {
        if (!solved) { score++; streak++; scoreEl.textContent = score; streakEl.textContent = streak; solved = true; }
        say('ok', '🎉 正确！' + raw + ' = 24');
      } else {
        streak = 0; streakEl.textContent = '0';
        say('no', '结果是 ' + (Math.round(val * 1000) / 1000) + '，不是 24，再试试');
      }
    }

    function say(cls, text) { fb.className = 'feedback ' + cls; fb.textContent = text; }

    document.getElementById('p24New').onclick = gen;
    document.getElementById('p24Check').onclick = check;
    document.getElementById('p24Show').onclick = function () {
      streak = 0; streakEl.textContent = '0';
      if (cur.solution) {
        var s = cur.solution;
        if (s.charAt(0) === '(' ) s = s.slice(1, -1);
        say('', '💡 一种算法：' + s + ' = 24');
        fb.style.color = 'var(--klein)';
        setTimeout(function () { fb.style.color = ''; }, 4000);
      } else {
        say('no', '这组数字确实无解，换一组吧');
      }
    };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    gen();
  })();

  /* =========================================================
     4. 反应力测试
     ========================================================= */
  (function reaction() {
    var pad = document.getElementById('rtPad');
    var nowEl = document.getElementById('rtNow');
    var bestEl = document.getElementById('rtBest');
    var avgEl = document.getElementById('rtAvg');
    var fb = document.getElementById('rtFb');
    if (!pad) return;

    var state = 'idle', t0 = 0, timer = null, list = [];

    function showBest() {
      var b = BrainStore.get('rt.best', null);
      bestEl.textContent = b === null ? '—' : b + 'ms';
    }

    function comment(ms) {
      if (ms < 180) return '闪电级！职业电竞选手水平 ⚡';
      if (ms < 230) return '非常快，比大多数大人还快 🔥';
      if (ms < 280) return '正常偏快，稳定发挥 👍';
      if (ms < 350) return '还行，多练几次会更快 🙂';
      return '有点走神啦，再来一次 💤';
    }

    pad.addEventListener('click', function () {
      if (state === 'idle') {
        state = 'wait';
        pad.className = 'react-pad wait';
        pad.textContent = '等变绿…别急';
        fb.textContent = ''; fb.className = 'feedback center';
        timer = setTimeout(function () {
          state = 'go';
          t0 = performance.now();
          pad.className = 'react-pad go';
          pad.textContent = '点！！';
        }, randInt(1200, 4200));

      } else if (state === 'wait') {
        clearTimeout(timer);
        state = 'idle';
        pad.className = 'react-pad';
        pad.textContent = '点这里再来一次';
        fb.className = 'feedback center no';
        fb.textContent = '❌ 抢跑啦！要等变绿再点。';

      } else if (state === 'go') {
        var ms = Math.round(performance.now() - t0);
        state = 'idle';
        list.push(ms);
        nowEl.textContent = ms + 'ms';
        var avg = Math.round(list.reduce(function (a, b) { return a + b; }, 0) / list.length);
        avgEl.textContent = avg + 'ms';
        var isBest = BrainStore.best('rt.best', ms, true);
        showBest();
        pad.className = 'react-pad';
        pad.textContent = '点这里再来一次';
        fb.className = 'feedback center ok';
        fb.textContent = ms + ' 毫秒 · ' + comment(ms) + (isBest ? ' 新纪录！' : '');
      }
    });

    showBest();
  })();

  /* =========================================================
     5. 滑块拼图（数字华容道迷你版）
     ========================================================= */
  (function sliding() {
    var grid = document.getElementById('slGrid');
    var stepsEl = document.getElementById('slSteps');
    var timeEl = document.getElementById('slTime');
    var bestEl = document.getElementById('slBest');
    var fb = document.getElementById('slFb');
    if (!grid) return;

    var N = 3, cells = [], blank = N * N - 1, steps = 0, sec = 0, timer = null, started = false, solved = false;

    function showBest() {
      var b = BrainStore.get('slide.best', null);
      bestEl.textContent = b === null ? '—' : b + ' 步';
    }
    function tick() { sec++; timeEl.textContent = sec; }
    function goal() { var a = []; for (var i = 1; i < N * N; i++) a.push(i); a.push(0); return a; }
    function neighbors(p) {
      var r = Math.floor(p / N), c = p % N, out = [];
      if (r > 0) out.push(p - N); if (r < N - 1) out.push(p + N);
      if (c > 0) out.push(p - 1); if (c < N - 1) out.push(p + 1);
      return out;
    }
    function reset() {
      clearInterval(timer); timer = null; started = false; sec = 0; steps = 0; solved = false;
      stepsEl.textContent = '0'; timeEl.textContent = '0'; fb.textContent = ''; fb.className = 'feedback center';
      cells = goal();
      var pos = N * N - 1;
      for (var m = 0; m < 120; m++) {
        var nb = neighbors(pos);
        var pick = nb[randInt(0, nb.length - 1)];
        cells[pos] = cells[pick]; cells[pick] = 0; pos = pick;
      }
      blank = pos; render(); showBest();
    }
    function render() {
      grid.innerHTML = '';
      cells.forEach(function (v, idx) {
        var b = document.createElement('button');
        b.className = 'slide-tile' + (v === 0 ? ' empty' : '');
        if (v !== 0) b.textContent = v;
        b.onclick = function () { move(idx); };
        grid.appendChild(b);
      });
    }
    function move(idx) {
      if (solved) return;
      if (neighbors(idx).indexOf(blank) === -1) return;
      if (!started) { started = true; timer = setInterval(tick, 1000); }
      cells[blank] = cells[idx]; cells[idx] = 0; blank = idx;
      steps++; stepsEl.textContent = steps;
      render();
      if (cells.join(',') === goal().join(',')) win();
    }
    function win() {
      clearInterval(timer); solved = true;
      var isBest = BrainStore.best('slide.best', steps, true);
      showBest();
      fb.className = 'feedback center ok';
      fb.textContent = '🎉 拼好啦！用了 ' + steps + ' 步、' + sec + ' 秒。' + (isBest ? ' 破纪录！' : '');
    }
    document.getElementById('slNew').onclick = reset;
    reset();
  })();

  /* =========================================================
     6. 猜数字
     ========================================================= */
  (function guesser() {
    var input = document.getElementById('gsInput');
    var fb = document.getElementById('gsFb');
    var triesEl = document.getElementById('gsTries');
    var rangeEl = document.getElementById('gsRange');
    var bestEl = document.getElementById('gsBest');
    if (!input) return;

    var secret = 0, tries = 0, lo = 1, hi = 100;

    function showBest() {
      var b = BrainStore.get('guess.best', null);
      bestEl.textContent = b === null ? '—' : b + ' 次';
    }
    function reset() {
      secret = randInt(1, 100); tries = 0; lo = 1; hi = 100;
      triesEl.textContent = '0'; rangeEl.textContent = lo + '-' + hi;
      fb.textContent = ''; fb.className = 'feedback'; input.value = ''; input.disabled = false;
      input.focus();
    }
    function go() {
      if (input.disabled) return;
      var v = parseInt(input.value, 10);
      if (isNaN(v)) { fb.className = 'feedback no'; fb.textContent = '先输入一个数字哦'; return; }
      if (v < lo || v > hi) { fb.className = 'feedback no'; fb.textContent = '范围外啦，现在在 ' + lo + '–' + hi + ' 之间'; return; }
      tries++; triesEl.textContent = tries;
      if (v === secret) {
        input.disabled = true;
        var isBest = BrainStore.best('guess.best', tries, true); showBest();
        fb.className = 'feedback ok';
        fb.textContent = '🎉 猜中啦！就是 ' + secret + '，用了 ' + tries + ' 次。' + (isBest ? ' 最少纪录！' : '');
      } else if (v < secret) {
        lo = Math.max(lo, v + 1); rangeEl.textContent = lo + '-' + hi;
        fb.className = 'feedback'; fb.textContent = '太小了，往大猜 👆 现在范围 ' + lo + '–' + hi;
      } else {
        hi = Math.min(hi, v - 1); rangeEl.textContent = lo + '-' + hi;
        fb.className = 'feedback'; fb.textContent = '太大了，往小猜 👇 现在范围 ' + lo + '–' + hi;
      }
      input.value = ''; input.focus();
    }
    document.getElementById('gsGo').onclick = go;
    document.getElementById('gsNew').onclick = reset;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    showBest(); reset();
  })();

  /* =========================================================
     7. 颜色反应（Stroop 效应）
     ========================================================= */
  (function stroop() {
    var wordEl = document.getElementById('stWord');
    var btnsEl = document.getElementById('stBtns');
    var fb = document.getElementById('stFb');
    var noEl = document.getElementById('stNo');
    var rightEl = document.getElementById('stRight');
    var timeEl = document.getElementById('stTime');
    var bestEl = document.getElementById('stBest');
    if (!wordEl) return;

    var COLORS = [
      { n: '红', c: '#FF5A5F' }, { n: '黄', c: '#FFD400' },
      { n: '蓝', c: '#002FA7' }, { n: '绿', c: '#17C3A2' }
    ];
    var total = 12, no = 0, right = 0, t0 = 0, running = false;

    function showBest() {
      var b = BrainStore.get('stroop.best', null);
      bestEl.textContent = b === null ? '—' : b + '/' + total;
    }
    function start() {
      no = 0; right = 0; noEl.textContent = '1'; rightEl.textContent = '0';
      fb.textContent = ''; fb.className = 'feedback center';
      t0 = performance.now(); running = true; timeEl.textContent = '0.0';
      round(); showBest();
    }
    function round() {
      var ink = COLORS[randInt(0, 3)];
      var word = COLORS[randInt(0, 3)];
      while (word.c === ink.c) word = COLORS[randInt(0, 3)];
      wordEl.textContent = word.n; wordEl.style.color = ink.c;
      btnsEl.innerHTML = '';
      shuffle(COLORS).forEach(function (col) {
        var b = document.createElement('button');
        b.className = 'stroop-color-btn'; b.style.background = col.c;
        b.onclick = function () { pick(col.c, ink.c); };
        btnsEl.appendChild(b);
      });
    }
    function pick(chosen, ink) {
      if (!running) return;
      no++;
      if (chosen === ink) {
        right++; rightEl.textContent = right;
        fb.className = 'feedback center ok'; fb.textContent = '✅ 对！';
      } else {
        fb.className = 'feedback center no'; fb.textContent = '❌ 要看「字的颜色」不是字义哦';
      }
      if (no >= total) {
        running = false;
        var used = (performance.now() - t0) / 1000; timeEl.textContent = used.toFixed(1);
        var isBest = BrainStore.best('stroop.best', right, false); showBest();
        fb.className = 'feedback center ok';
        fb.textContent = '🏁 12 题做完，答对 ' + right + '/' + total + '，用时 ' + used.toFixed(1) + ' 秒。' + (isBest ? ' 新纪录！' : '');
        noEl.textContent = total;
      } else {
        noEl.textContent = no + 1;
        setTimeout(round, 360);
      }
    }
    document.getElementById('stNew').onclick = start;
    start();
  })();

  /* =========================================================
     8. 打字小将
     ========================================================= */
  (function typist() {
    var target = document.getElementById('tyTarget');
    var input = document.getElementById('tyInput');
    var fb = document.getElementById('tyFb');
    var noEl = document.getElementById('tyNo');
    var timeEl = document.getElementById('tyTime');
    var bestEl = document.getElementById('tyBest');
    if (!target) return;

    var WORDS = ['苹果', '太阳', '彩虹', '科学', '宇宙', '梦想', '勇敢', '朋友', '音乐', '快乐',
      '星星', '森林', '海洋', '微笑', '光明', '冒险', '糖果', '风筝', '月亮', '飞船',
      'apple', 'brain', 'smile', 'light', 'dream', 'cloud', 'star', 'magic', 'happy', 'peace'];
    var total = 10, idx = 0, t0 = 0, running = false;

    function showBest() {
      var b = BrainStore.get('type.best', null);
      bestEl.textContent = b === null ? '—' : b;
    }
    function next() {
      if (idx >= total) return finish();
      target.textContent = WORDS[idx];
      noEl.textContent = idx;
      input.value = ''; input.focus();
    }
    function start() {
      idx = 0; running = true; t0 = performance.now(); timeEl.textContent = '0.0';
      fb.textContent = ''; fb.className = 'feedback'; input.disabled = false;
      next(); showBest();
    }
    function finish() {
      running = false; input.disabled = true;
      var used = (performance.now() - t0) / 1000; timeEl.textContent = used.toFixed(1);
      var wpm = Math.round(total / (used / 60));
      var isBest = BrainStore.best('type.best', wpm, false); showBest();
      target.textContent = '🏁 完成！';
      fb.className = 'feedback ok';
      fb.textContent = '10 个词用了 ' + used.toFixed(1) + ' 秒，速度约 ' + wpm + ' WPM（词/分钟）' + (isBest ? ' · 新纪录！' : '');
    }
    function submit() {
      if (!running) return;
      var v = (input.value || '').trim();
      if (v === target.textContent) {
        idx++;
        if (idx >= total) finish();
        else { fb.className = 'feedback ok'; fb.textContent = '✅ 对！'; next(); }
      } else {
        fb.className = 'feedback no'; fb.textContent = '❌ 再看看，要一模一样哦（含大小写）';
      }
    }
    document.getElementById('tyNew').onclick = start;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    target.textContent = '点「重新开始」开始';
    showBest();
  })();

  /* =========================================================
     9. 数独迷你（4×4）
     ========================================================= */
  (function sudoku() {
    var grid = document.getElementById('suGrid');
    var pad = document.getElementById('suPad');
    var fb = document.getElementById('suFb');
    var timeEl = document.getElementById('suTime');
    var bestEl = document.getElementById('suBest');
    if (!grid) return;

    var sol = [], puzzle = [], given = [], sel = -1, sec = 0, timer = null, started = false, done = false;

    function showBest() {
      var b = BrainStore.get('su.best', null);
      bestEl.textContent = b === null ? '—' : b + 's';
    }
    function tick() { sec++; timeEl.textContent = sec; }

    function genSol() {
      sol = new Array(16).fill(0);
      function ok(p, v) {
        var r = Math.floor(p / 4), c = p % 4, i;
        for (i = 0; i < 4; i++) { if (sol[r * 4 + i] === v) return false; if (sol[i * 4 + c] === v) return false; }
        var br = Math.floor(r / 2) * 2, bc = Math.floor(c / 2) * 2;
        for (i = 0; i < 2; i++) for (var j = 0; j < 2; j++) if (sol[(br + i) * 4 + (bc + j)] === v) return false;
        return true;
      }
      function fill(p) {
        if (p === 16) return true;
        var nums = shuffle([1, 2, 3, 4]);
        for (var k = 0; k < 4; k++) {
          var v = nums[k];
          if (ok(p, v)) { sol[p] = v; if (fill(p + 1)) return true; sol[p] = 0; }
        }
        return false;
      }
      fill(0);
    }

    function reset() {
      clearInterval(timer); timer = null; started = false; sec = 0; done = false; sel = -1;
      timeEl.textContent = '0'; fb.textContent = ''; fb.className = 'feedback center';
      genSol();
      puzzle = sol.slice();
      given = new Array(16).fill(false);
      shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).slice(0, 9).forEach(function (p) { puzzle[p] = 0; });
      for (var p = 0; p < 16; p++) given[p] = puzzle[p] !== 0;
      render(); showBest();
    }

    function render() {
      grid.innerHTML = '';
      for (var p = 0; p < 16; p++) {
        var cell = document.createElement('div');
        cell.className = 'sudoku-cell' + (given[p] ? ' given' : '') + (sel === p ? ' sel' : '');
        cell.textContent = puzzle[p] ? puzzle[p] : '';
        if (!given[p]) (function (pp) { cell.onclick = function () { sel = pp; render(); }; })(p);
        grid.appendChild(cell);
      }
    }

    pad.innerHTML = '';
    [1, 2, 3, 4].forEach(function (n) {
      var b = document.createElement('button');
      b.className = 'np'; b.textContent = n;
      b.onclick = function () {
        if (sel < 0 || done) return;
        if (!started) { started = true; timer = setInterval(tick, 1000); }
        puzzle[sel] = n; sel = -1; render(); check();
      };
      pad.appendChild(b);
    });

    function check() {
      if (puzzle.indexOf(0) !== -1) return;
      function valid() {
        for (var r = 0; r < 4; r++) {
          var row = {}, col = {};
          for (var c = 0; c < 4; c++) { row[puzzle[r * 4 + c]] = 1; col[puzzle[c * 4 + r]] = 1; }
          if (Object.keys(row).length !== 4 || Object.keys(col).length !== 4) return false;
        }
        for (var br = 0; br < 4; br += 2) for (var bc = 0; bc < 4; bc += 2) {
          var s = {};
          for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) s[puzzle[(br + i) * 4 + bc + j]] = 1;
          if (Object.keys(s).length !== 4) return false;
        }
        return true;
      }
      if (valid()) {
        done = true; clearInterval(timer);
        var isBest = BrainStore.best('su.best', sec, true); showBest();
        fb.className = 'feedback center ok';
        fb.textContent = '🎉 全部填对！用了 ' + sec + ' 秒' + (isBest ? ' 新纪录！' : '');
      } else {
        fb.className = 'feedback center no';
        fb.textContent = '有重复啦，再检查每行、每列、每个田字格';
      }
    }

    document.getElementById('suNew').onclick = reset;
    reset();
  })();

  /* =========================================================
     10. 数字广度（记忆）
     ========================================================= */
  (function digitSpan() {
    var show = document.getElementById('spShow');
    var fb = document.getElementById('spFb');
    var lenEl = document.getElementById('spLen');
    var bestEl = document.getElementById('spBest');
    var inputWrap = document.getElementById('spInputWrap');
    var input = document.getElementById('spInput');
    if (!show) return;

    var seq = [], len = 3, showing = false;

    function showBest() {
      var b = BrainStore.get('sp.best', null);
      bestEl.textContent = b === null ? '—' : b + ' 位';
    }
    function start() { len = 3; lenEl.textContent = len; fb.textContent = ''; fb.className = 'feedback center'; nextRound(); }
    function nextRound() {
      seq = []; for (var i = 0; i < len; i++) seq.push(randInt(0, 9));
      inputWrap.style.display = 'none'; showing = true; show.textContent = '';
      var i = 0;
      function flash() {
        if (i < seq.length) {
          show.textContent = seq[i]; i++;
          setTimeout(function () { show.textContent = ''; setTimeout(flash, 200); }, 650);
        } else {
          showing = false; show.textContent = '请按顺序输入 →';
          inputWrap.style.display = 'block'; input.value = ''; input.focus();
        }
      }
      flash();
    }
    function submit() {
      if (showing) return;
      var v = (input.value || '').replace(/\s/g, '');
      if (v.length !== seq.length) { fb.className = 'feedback no'; fb.textContent = '要输入 ' + seq.length + ' 位数字哦'; return; }
      if (v === seq.join('')) {
        var isBest = BrainStore.best('sp.best', len, false); showBest();
        if (len >= 9) { fb.className = 'feedback ok'; fb.textContent = '🏆 长度 ' + len + ' 已封顶，太强了！'; inputWrap.style.display = 'none'; return; }
        len++; lenEl.textContent = len;
        fb.className = 'feedback ok'; fb.textContent = '✅ 对！长度加到 ' + len;
        nextRound();
      } else {
        fb.className = 'feedback no'; fb.textContent = '❌ 正确答案是 ' + seq.join(' ') + '（你记到了 ' + (len - 1) + ' 位）';
        inputWrap.style.display = 'none';
        setTimeout(function () { len = 3; lenEl.textContent = len; nextRound(); }, 1800);
      }
    }
    document.getElementById('spNew').onclick = start;
    document.getElementById('spSubmit').onclick = submit;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    showBest();
  })();

  /* =========================================================
     11. 找规律
     ========================================================= */
  (function sequence() {
    var row = document.getElementById('sqRow');
    var optsEl = document.getElementById('sqOpts');
    var fb = document.getElementById('sqFb');
    var rightEl = document.getElementById('sqRight');
    var streakEl = document.getElementById('sqStreak');
    if (!row) return;

    var LIST = [
      { n: [2, 4, 6, 8], a: 10, opts: [9, 10, 11, 12] },
      { n: [1, 4, 9, 16], a: 25, opts: [20, 24, 25, 30] },
      { n: [3, 6, 12, 24], a: 48, opts: [36, 48, 60, 72] },
      { n: [1, 1, 2, 3, 5], a: 8, opts: [7, 8, 9, 10] },
      { n: [100, 90, 81, 73], a: 66, opts: [64, 66, 68, 70] },
      { n: [2, 3, 5, 7, 11], a: 13, opts: [12, 13, 14, 15] },
      { n: [1, 2, 4, 8], a: 16, opts: [14, 16, 18, 20] },
      { n: [9, 7, 5, 3], a: 1, opts: [0, 1, 2, 3] },
      { n: [1, 3, 6, 10], a: 15, opts: [13, 15, 17, 20] },
      { n: [2, 6, 12, 20], a: 30, opts: [28, 30, 32, 36] },
      { n: [1, 4, 2, 8, 4], a: 16, opts: [8, 12, 16, 20] },
      { n: [5, 10, 15, 20], a: 25, opts: [24, 25, 26, 30] },
      { n: [1, 2, 3, 5, 8], a: 13, opts: [11, 12, 13, 14] },
      { n: [10, 20, 30, 40], a: 50, opts: [45, 50, 55, 60] },
      { n: [81, 64, 49, 36], a: 25, opts: [24, 25, 26, 30] }
    ];
    var cur = null, right = 0, streak = 0;

    function gen() {
      cur = LIST[randInt(0, LIST.length - 1)];
      row.innerHTML = '';
      cur.n.forEach(function (x) {
        var d = document.createElement('span'); d.className = 'seq-num'; d.textContent = x; row.appendChild(d);
      });
      var q = document.createElement('span'); q.className = 'seq-num q'; q.textContent = '?'; row.appendChild(q);
      optsEl.innerHTML = '';
      shuffle(cur.opts.slice()).forEach(function (v) {
        var b = document.createElement('button'); b.className = 'opt'; b.textContent = v;
        b.onclick = function () { pick(v, b); };
        optsEl.appendChild(b);
      });
      fb.textContent = ''; fb.className = 'feedback';
    }
    function pick(v, b) {
      if (v === cur.a) {
        right++; rightEl.textContent = right; streak++; streakEl.textContent = streak;
        fb.className = 'feedback ok'; fb.textContent = '✅ 对！下一个是 ' + cur.a;
        optsEl.querySelectorAll('.opt').forEach(function (x) { x.disabled = true; });
        setTimeout(gen, 900);
      } else {
        streak = 0; streakEl.textContent = 0;
        fb.className = 'feedback no'; fb.textContent = '❌ 正确答案是 ' + cur.a;
        b.disabled = true; b.classList.add('wrong');
      }
    }
    document.getElementById('sqNew').onclick = gen;
    gen();
  })();

  /* =========================================================
     12. 颜色记忆（Simon）
     ========================================================= */
  (function simon() {
    var board = document.getElementById('smBoard');
    var fb = document.getElementById('smFb');
    var lenEl = document.getElementById('smLen');
    var bestEl = document.getElementById('smBest');
    if (!board) return;

    var seq = [], userPos = 0, accepting = false, playing = false;
    var pads = board.querySelectorAll('.simon-pad');
    pads.forEach(function (p) { p.style.opacity = '.35'; });

    function showBest() {
      var b = BrainStore.get('sm.best', null);
      bestEl.textContent = b === null ? '—' : b;
    }
    function playSeq() {
      accepting = false; var i = 0;
      function step() {
        if (i >= seq.length) { accepting = true; fb.textContent = '轮到你了，照着点出来'; return; }
        var c = seq[i];
        var pad = board.querySelector('.simon-pad[data-c="' + c + '"]');
        pad.style.opacity = '1';
        setTimeout(function () { pad.style.opacity = '.35'; }, 350);
        i++; setTimeout(step, 600);
      }
      step();
    }
    function round() {
      seq.push(randInt(0, 3)); lenEl.textContent = seq.length;
      fb.textContent = '看好…'; setTimeout(playSeq, 500);
    }
    function pick(c) {
      if (!accepting) return;
      var pad = board.querySelector('.simon-pad[data-c="' + c + '"]');
      pad.style.opacity = '1'; setTimeout(function () { pad.style.opacity = '.35'; }, 250);
      if (seq[userPos] === c) {
        userPos++;
        if (userPos === seq.length) {
          userPos = 0;
          var isB = BrainStore.best('sm.best', seq.length, false); showBest();
          fb.textContent = '✅ 全部对！加一个…';
          setTimeout(round, 700);
        }
      } else {
        accepting = false;
        var isB2 = BrainStore.best('sm.best', seq.length - 1, false); showBest();
        fb.className = 'feedback center no';
        fb.textContent = '❌ 记错啦，这次长度到 ' + (seq.length) + '。点「开始」再来';
        playing = false;
      }
    }
    pads.forEach(function (p) {
      p.onclick = function () { if (playing) pick(parseInt(p.dataset.c, 10)); };
    });
    document.getElementById('smNew').onclick = function () {
      seq = []; userPos = 0; playing = true; fb.className = 'feedback center'; fb.textContent = '记住亮灯顺序';
      round();
    };
    showBest();
  })();

  /* =========================================================
     13. 找不同
     ========================================================= */
  (function spotDiff() {
    var left = document.getElementById('dfLeft');
    var right = document.getElementById('dfRight');
    var fb = document.getElementById('dfFb');
    var foundEl = document.getElementById('dfFound');
    var bestEl = document.getElementById('dfBest');
    if (!left) return;

    var EMOJI = ['🍎', '🍌', '🍊', '🍇', '🍓', '🍉', '🥝', '🍑', '🫐', '🍒', '🍍', '🥥', '🥭', '🍐', '🍈'];
    var N = 20, found = 0;

    function showBest() {
      var b = BrainStore.get('df.best', null);
      bestEl.textContent = b === null ? '—' : b;
    }
    function reset() {
      fb.textContent = '点右边那幅里不对劲的格子'; fb.className = 'feedback center';
      var base = []; for (var i = 0; i < N; i++) base.push(EMOJI[randInt(0, EMOJI.length - 1)]);
      var diffIdx = randInt(0, N - 1);
      var alt = EMOJI[randInt(0, EMOJI.length - 1)];
      while (alt === base[diffIdx]) alt = EMOJI[randInt(0, EMOJI.length - 1)];
      left.innerHTML = ''; right.innerHTML = '';
      for (var i = 0; i < N; i++) {
        var a = document.createElement('div'); a.className = 'diff-cell'; a.textContent = base[i]; left.appendChild(a);
        var b = document.createElement('div'); b.className = 'diff-cell'; b.textContent = (i === diffIdx) ? alt : base[i];
        (function (idx) {
          b.onclick = function () {
            if (b.classList.contains('found')) return;
            if (idx === diffIdx) {
              b.classList.add('found'); found++; foundEl.textContent = found;
              var isB = BrainStore.best('df.best', found, false); showBest();
              fb.className = 'feedback center ok'; fb.textContent = '✅ 找到啦！再点「换一张」继续';
            } else {
              fb.className = 'feedback center no'; fb.textContent = '这里一样哦，再找找';
            }
          };
        })(i);
        right.appendChild(b);
      }
    }
    document.getElementById('dfNew').onclick = reset;
    showBest(); reset();
  })();

  /* =========================================================
     14. 圈叉棋（对电脑）
     ========================================================= */
  (function ttt() {
    var board = document.getElementById('ttBoard');
    var fb = document.getElementById('ttFb');
    var winEl = document.getElementById('ttWin');
    var loseEl = document.getElementById('ttLose');
    if (!board) return;

    var cells = [], over = false;
    var wins = BrainStore.get('tt.win', 0), loses = BrainStore.get('tt.lose', 0);
    winEl.textContent = wins; loseEl.textContent = loses;
    var LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

    function draw() {
      board.innerHTML = '';
      for (var i = 0; i < 9; i++) {
        var c = document.createElement('div'); c.className = 'ttt-cell'; c.textContent = cells[i] || '';
        (function (i) { c.onclick = function () { move(i); }; })(i);
        board.appendChild(c);
      }
    }
    function reset() { cells = new Array(9).fill(''); over = false; fb.textContent = '你先走 ✕'; fb.className = 'feedback center'; draw(); }
    function move(i) {
      if (over || cells[i]) return;
      cells[i] = 'X'; draw();
      if (win('X')) { end(true); return; }
      if (full()) { end(null); return; }
      aiMove();
      if (win('O')) { end(false); return; }
      if (full()) { end(null); return; }
    }
    function findWin(p) {
      for (var k = 0; k < LINES.length; k++) {
        var a = LINES[k][0], b = LINES[k][1], c = LINES[k][2];
        if (cells[a] === p && cells[b] === p && !cells[c]) return c;
        if (cells[a] === p && cells[c] === p && !cells[b]) return b;
        if (cells[b] === p && cells[c] === p && !cells[a]) return a;
      }
      return -1;
    }
    function aiMove() {
      var i = findWin('O'); if (i >= 0) { cells[i] = 'O'; draw(); return; }
      i = findWin('X'); if (i >= 0) { cells[i] = 'O'; draw(); return; }
      if (!cells[4]) { cells[4] = 'O'; draw(); return; }
      var corners = [0, 2, 6, 8].filter(function (x) { return !cells[x]; });
      if (corners.length) { cells[corners[randInt(0, corners.length - 1)]] = 'O'; draw(); return; }
      var empties = []; for (var k = 0; k < 9; k++) if (!cells[k]) empties.push(k);
      if (empties.length) { cells[empties[randInt(0, empties.length - 1)]] = 'O'; draw(); }
    }
    function win(p) {
      for (var k = 0; k < LINES.length; k++) if (cells[LINES[k][0]] === p && cells[LINES[k][1]] === p && cells[LINES[k][2]] === p) return true;
      return false;
    }
    function full() { return cells.indexOf('') === -1; }
    function end(playerWin) {
      over = true;
      if (playerWin === true) { BrainStore.set('tt.win', ++wins); winEl.textContent = wins; fb.className = 'feedback center ok'; fb.textContent = '🏆 你赢了！'; }
      else if (playerWin === false) { BrainStore.set('tt.lose', ++loses); loseEl.textContent = loses; fb.className = 'feedback center no'; fb.textContent = '😼 电脑赢了，再来一局！'; }
      else { fb.className = 'feedback center'; fb.textContent = '🤝 平局！'; }
    }
    document.getElementById('ttNew').onclick = reset;
    reset();
  })();

  /* =========================================================
     15. 拼字游戏
     ========================================================= */
  (function wordScramble() {
    var sc = document.getElementById('wdScramble');
    var input = document.getElementById('wdInput');
    var fb = document.getElementById('wdFb');
    var rightEl = document.getElementById('wdRight');
    var streakEl = document.getElementById('wdStreak');
    if (!sc) return;

    var WORDS = ['APPLE', 'BRAIN', 'CLOUD', 'DREAM', 'EARTH', 'FLAME', 'GREEN', 'HEART', 'IMAGE', 'LIGHT',
      'MAGIC', 'NIGHT', 'OCEAN', 'PEACE', 'SMART', 'SUGAR', 'TIGER', 'WATER', 'ZEBRA', 'PLANET',
      'RIVER', 'SNAKE', 'STONE', 'WHEEL', 'MOUSE', 'LEMON', 'TIGER', 'PIANO', 'QUEEN', 'ROBOT'];
    var cur = '', right = 0, streak = 0;
    function scramble(w) { var a; do { a = shuffle(w.split('')).join(''); } while (a === w); return a; }
    function gen() { cur = WORDS[randInt(0, WORDS.length - 1)]; sc.textContent = scramble(cur); input.value = ''; fb.textContent = ''; fb.className = 'feedback center'; }
    function submit() {
      var v = (input.value || '').trim().toUpperCase();
      if (!v) { fb.className = 'feedback no'; fb.textContent = '先拼一个词吧'; return; }
      if (v === cur) {
        right++; rightEl.textContent = right; streak++; streakEl.textContent = streak;
        fb.className = 'feedback ok'; fb.textContent = '✅ 对！是 ' + cur;
        setTimeout(gen, 800);
      } else {
        streak = 0; streakEl.textContent = 0;
        fb.className = 'feedback no'; fb.textContent = '❌ 不是 ' + v + '，再试试（答案是 ' + cur + '）';
      }
    }
    document.getElementById('wdNew').onclick = gen;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    gen();
  })();

  /* =========================================================
     16. 走迷宫
     ========================================================= */
  (function maze() {
    var board = document.getElementById('mzBoard');
    var fb = document.getElementById('mzFb');
    var stepsEl = document.getElementById('mzSteps');
    var bestEl = document.getElementById('mzBest');
    if (!board) return;

    var N = 10, cells, px, py, steps, done;
    function showBest() {
      var b = BrainStore.get('mz.best', null);
      bestEl.textContent = b === null ? '—' : b + ' 步';
    }
    function gen() {
      cells = [];
      for (var r = 0; r < N; r++) { cells[r] = []; for (var c = 0; c < N; c++) cells[r][c] = { t: true, r: true, b: true, l: true, vis: false }; }
      var stack = [[0, 0]]; cells[0][0].vis = true;
      var dirs = [[-1, 0, 't', 'b'], [1, 0, 'b', 't'], [0, 1, 'r', 'l'], [0, -1, 'l', 'r']];
      while (stack.length) {
        var cur = stack[stack.length - 1], r = cur[0], c = cur[1], nbrs = [];
        dirs.forEach(function (d) {
          var nr = r + d[0], nc = c + d[1];
          if (nr >= 0 && nr < N && nc >= 0 && nc < N && !cells[nr][nc].vis) nbrs.push(d);
        });
        if (nbrs.length) {
          var d = nbrs[randInt(0, nbrs.length - 1)], nr = r + d[0], nc = c + d[1];
          cells[r][c][d[2]] = false; cells[nr][nc][d[3]] = false;
          cells[nr][nc].vis = true; stack.push([nr, nc]);
        } else stack.pop();
      }
      px = 0; py = 0; steps = 0; done = false;
      stepsEl.textContent = '0'; fb.textContent = '走到右下角的 🏁'; fb.className = 'feedback center';
      render(); showBest();
    }
    function render() {
      board.innerHTML = ''; board.style.gridTemplateColumns = 'repeat(' + N + ', 1fr)';
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var cell = cells[r][c];
        var d = document.createElement('div');
        d.className = 'maze-cell' + (r === py && c === px ? ' me' : '') + (r === N - 1 && c === N - 1 ? ' goal' : '');
        d.style.borderTopWidth = cell.t ? '3px' : '0';
        d.style.borderRightWidth = cell.r ? '3px' : '0';
        d.style.borderBottomWidth = cell.b ? '3px' : '0';
        d.style.borderLeftWidth = cell.l ? '3px' : '0';
        (function (rr, cc) { d.onclick = function () { tryMove(rr, cc); }; })(r, c);
        board.appendChild(d);
      }
    }
    function tryMove(nr, nc) {
      if (done) return;
      if (nr < 0 || nr >= N || nc < 0 || nc >= N) return;
      if (nr === px && nc === py) return;
      if (Math.abs(nr - px) + Math.abs(nc - py) !== 1) return;
      var cell = cells[px][py];
      if (nr === px - 1 && cell.t) return;
      if (nr === px + 1 && cell.b) return;
      if (nc === py + 1 && cell.r) return;
      if (nc === py - 1 && cell.l) return;
      px = nr; py = nc; steps++; stepsEl.textContent = steps;
      if (px === N - 1 && py === N - 1) win();
      render();
    }
    function win() {
      done = true;
      var isB = BrainStore.best('mz.best', steps, true); showBest();
      fb.className = 'feedback center ok';
      fb.textContent = '🏁 走出迷宫！用了 ' + steps + ' 步' + (isB ? ' 新纪录！' : '');
    }
    document.addEventListener('keydown', function (e) {
      if (!document.getElementById('g-maze').classList.contains('on')) return;
      if (e.key === 'ArrowUp') tryMove(px - 1, py);
      else if (e.key === 'ArrowDown') tryMove(px + 1, py);
      else if (e.key === 'ArrowLeft') tryMove(px, py - 1);
      else if (e.key === 'ArrowRight') tryMove(px, py + 1);
    });
    document.getElementById('mzNew').onclick = gen;
    gen();
  })();
})();
