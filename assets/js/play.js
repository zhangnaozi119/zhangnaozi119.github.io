/* 长脑子好玩 · 汉诺塔 / 视错觉 / 思维谜题 */
(function () {
  'use strict';

  /* =========================================================
     1. 汉诺塔
     ========================================================= */
  (function hanoi() {
    var board = document.getElementById('hnBoard');
    var stepsEl = document.getElementById('hnSteps');
    var minEl = document.getElementById('hnMin');
    var levelSel = document.getElementById('hnLevel');
    var fb = document.getElementById('hnFb');
    if (!board) return;

    var COLORS = ['#002FA7', '#1E48C8', '#4B72F0', '#8B5CF6', '#17C3A2', '#FFB020'];
    var pegs = [[], [], []], n = 3, steps = 0, sel = -1;

    function reset() {
      n = parseInt(levelSel.value, 10);
      pegs = [[], [], []];
      for (var i = n; i >= 1; i--) pegs[0].push(i);
      steps = 0; sel = -1;
      stepsEl.textContent = '0';
      minEl.textContent = Math.pow(2, n) - 1;
      fb.className = 'feedback center';
      fb.textContent = '点一根柱子选中最上面的盘，再点另一根柱子放下。';
      draw();
    }

    function draw() {
      board.innerHTML = '';
      pegs.forEach(function (stack, idx) {
        var peg = document.createElement('div');
        peg.className = 'peg' + (sel === idx ? ' sel' : '');
        peg.onclick = function () { click(idx); };
        stack.forEach(function (size) {
          var d = document.createElement('div');
          d.className = 'disc';
          d.style.width = (28 + size * (n > 4 ? 22 : 26)) + 'px';
          d.style.background = COLORS[(size - 1) % COLORS.length];
          d.style.height = (n > 5 ? 18 : 22) + 'px';
          d.textContent = size;
          peg.appendChild(d);
        });
        board.appendChild(peg);
      });
    }

    function click(i) {
      if (sel === -1) {
        if (!pegs[i].length) { warn('这根柱子是空的'); return; }
        sel = i; draw();
        return;
      }
      if (sel === i) { sel = -1; draw(); return; }

      var from = pegs[sel], to = pegs[i];
      var disc = from[from.length - 1];
      if (to.length && to[to.length - 1] < disc) {
        warn('❌ 大盘不能压在小盘上！');
        sel = -1; draw();
        return;
      }
      from.pop(); to.push(disc);
      steps++; stepsEl.textContent = steps;
      sel = -1; draw();

      if (pegs[2].length === n) {
        var min = Math.pow(2, n) - 1;
        fb.className = 'feedback center ok';
        fb.textContent = steps === min
          ? '🏆 完美！' + steps + ' 步就是理论最少步数，你已经掌握递归思路了。'
          : '🎉 搬完啦！用了 ' + steps + ' 步，最少只要 ' + min + ' 步，再试一次？';
      } else {
        fb.className = 'feedback center';
        fb.textContent = '';
      }
    }

    function warn(msg) {
      fb.className = 'feedback center no';
      fb.textContent = msg;
    }

    levelSel.onchange = reset;
    document.getElementById('hnNew').onclick = reset;
    reset();
  })();

  /* =========================================================
     2. 视错觉：生成图形 + 展开答案
     ========================================================= */
  (function illusions() {
    /* 咖啡墙 */
    var cw = document.getElementById('cafeWall');
    if (cw) {
      var html = '';
      for (var r = 0; r < 8; r++) {
        var offset = (r % 4) * 10; /* 每行错开，制造倾斜错觉 */
        html += '<div style="display:flex;height:26px;background:#888;transform:translateX(' + (offset - 15) + 'px);width:340px">';
        for (var c = 0; c < 9; c++) {
          html += '<div style="width:36px;height:26px;background:' + (c % 2 ? '#fff' : '#0A1230') + '"></div>';
        }
        html += '</div>';
      }
      cw.innerHTML = html;
      cw.style.background = '#9AA0B0';
    }

    /* 赫尔曼栅格 */
    var hm = document.getElementById('hermann');
    if (hm) {
      var s = '';
      for (var i = 0; i < 25; i++) s += '<div style="background:#fff;border-radius:2px"></div>';
      hm.innerHTML = s;
    }

    /* 展开答案 */
    document.querySelectorAll('.reveal-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var box = btn.nextElementSibling;
        var open = box.classList.toggle('on');
        btn.textContent = open ? '收起 ↑' : '看答案';
      });
    });
  })();

  /* =========================================================
     3. 思维谜题
     ========================================================= */
  (function riddles() {
    var box = document.getElementById('riddleList');
    if (!box) return;

    var DATA = [
      {
        tag: '经典逻辑',
        q: '过河问题：农夫要带一只狼、一只羊、一棵白菜过河。小船每次只能带一样东西。狼和羊不能单独留下，羊和白菜也不能单独留下。怎么过？',
        hint: '关键动作是：有一趟要「往回带」东西。',
        a: '① 带羊过去，空手回来。② 带狼过去，把羊带回来。③ 把羊留下，带白菜过去，空手回来。④ 最后带羊过去。核心在第 ② 步——敢把已经运过去的东西再带回来，这一步想不到就永远卡住。'
      },
      {
        tag: '称重',
        q: '有 8 个外表一样的球，其中 1 个稍重。用天平最少称几次能找出来？',
        hint: '别想着两两比，试试一次放三个。',
        a: '2 次。第一次：左 3 个 vs 右 3 个。如果平衡，重球在剩下的 2 个里，第二次直接称这 2 个。如果不平衡，重球在重的那 3 个里，任取 2 个称第二次。诀窍是天平有「左重、右重、平衡」三种结果，所以每次能三等分。'
      },
      {
        tag: '倒水',
        q: '你有一个 5 升和一个 3 升的桶，都没有刻度。怎么量出正好 4 升水？',
        hint: '3 升桶可以当「减 3」的工具用。',
        a: '装满 5 升 → 倒进 3 升桶（5 升桶剩 2 升）→ 倒空 3 升桶 → 把那 2 升倒进 3 升桶 → 再把 5 升桶装满 → 往 3 升桶里倒（它只能再装 1 升）→ 5 升桶里正好剩 4 升。'
      },
      {
        tag: '推理',
        q: '三个开关在楼下，控制楼上三盏灯。你只能上楼一次，怎么知道哪个开关对应哪盏灯？',
        hint: '灯泡除了亮，还有别的状态可以利用。',
        a: '打开 1 号开关，等 5 分钟后关掉；打开 2 号；上楼。亮着的是 2 号；灭但摸上去发烫的是 1 号；又灭又凉的是 3 号。答案的关键是想到「温度」也是一种信息。'
      },
      {
        tag: '数字',
        q: '一个数，加上它自己的一半等于 30。这个数是多少？',
        hint: '设它是 x，列个式子。',
        a: '20。因为 x + x/2 = 30，也就是 1.5x = 30，x = 20。很多人会脱口而出 15——那是「30 的一半」，中了直觉的圈套。'
      },
      {
        tag: '空间',
        q: '一个正方体，六个面涂满红漆，然后切成 27 个小正方体（3×3×3）。有多少个小方块正好有 2 个面是红的？',
        hint: '按位置分类：角上、棱上、面中间、最里面。',
        a: '12 个。8 个角块有 3 面红，12 个棱块有 2 面红，6 个面心块有 1 面红，最中间那 1 块一面都没有。8+12+6+1=27，正好对上。'
      },
      {
        tag: '陷阱题',
        q: '一只蜗牛在 10 米深的井底，白天爬 3 米，晚上滑下 2 米。它几天能爬出井口？',
        hint: '最后一天爬出去之后，还会滑下来吗？',
        a: '8 天。前 7 天每天净爬 1 米，到第 7 天结束时在 7 米处；第 8 天白天爬 3 米正好到 10 米出井了，不会再滑。答 10 天的人忘了「出去就不滑了」。'
      },
      {
        tag: '博弈',
        q: '桌上有 21 颗糖，两人轮流拿，每次可以拿 1 到 3 颗，拿到最后一颗的人赢。先手怎么必胜？',
        hint: '想想「每轮两人一共拿几颗」能被你控制。',
        a: '先手先拿 1 颗，剩 20 颗。之后对方拿 k 颗，你就拿 4−k 颗，保证每一轮两人合计拿 4 颗。20 是 4 的倍数，所以最后一颗一定被你拿到。这类题的通法：让剩余数量始终是 4 的倍数。'
      }
    ];

    DATA.forEach(function (it, i) {
      var card = document.createElement('div');
      card.className = 'card';
      card.innerHTML =
        '<span class="pill blue">' + it.tag + '</span>' +
        '<h3 class="mt16">' + it.q + '</h3>' +
        '<div class="row" style="justify-content:flex-start;gap:8px;margin-top:14px">' +
          '<button class="btn ghost sm" data-k="hint">给点提示 💡</button>' +
          '<button class="btn sm" data-k="ans">看答案</button>' +
        '</div>' +
        '<div class="riddle-step" data-s="hint" style="color:#8A6D00;background:rgba(255,212,0,.14);border-radius:14px;padding:12px 16px;font-size:14px">💡 ' + it.hint + '</div>' +
        '<div class="riddle-step" data-s="ans" style="color:var(--ink-2);background:var(--klein-mist);border-radius:14px;padding:14px 16px;font-size:14px;line-height:1.75">✅ ' + it.a + '</div>';

      card.querySelectorAll('button[data-k]').forEach(function (b) {
        b.addEventListener('click', function () {
          var t = card.querySelector('.riddle-step[data-s="' + b.dataset.k + '"]');
          var open = t.classList.toggle('on');
          if (b.dataset.k === 'hint') b.textContent = open ? '收起提示' : '给点提示 💡';
          else b.textContent = open ? '收起答案' : '看答案';
        });
      });
      box.appendChild(card);
    });
  })();
})();
