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
})();
