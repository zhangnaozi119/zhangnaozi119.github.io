/* 学习长脑子 · 物理问答子模块（每日热点物理三层讲解） */
(function () {
  'use strict';

  var box = document.getElementById('phList');
  var dateSel = document.getElementById('phDate');
  var fb = document.getElementById('phFb');
  if (!box) return;

  var MANIFEST = 'assets/physics/manifest.json';
  var LETTERS = ['A', 'B', 'C', 'D'];
  var issues = [];
  var total = 0, doneCount = 0, score = 0;

  function loadManifest() {
    fetch(MANIFEST + '?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (m) {
        issues = Array.isArray(m.issues) ? m.issues : [];
        if (!issues.length) {
          box.innerHTML = '<p class="lead">还没有物理问答，等每天自动生成后就会出现在这里～</p>';
          return;
        }
        dateSel.innerHTML = issues.map(function (it) {
          var label = it.date + (it.title ? ' · ' + it.title : '');
          return '<option value="' + it.file + '">' + label + '</option>';
        }).join('');
        dateSel.onchange = function () { loadIssue(dateSel.value); };
        loadIssue(issues[0].file);
      })
      .catch(function (e) {
        box.innerHTML = '<p class="lead">读取物理问答列表失败：' + e + '</p>';
      });
  }

  function loadIssue(file) {
    box.innerHTML = '<p class="hint">加载中…</p>';
    if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    fetch(file + '?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function (e) {
        box.innerHTML = '<p class="lead">读取本期物理问答失败：' + e + '</p>';
      });
  }

  function render(data) {
    var qs = (data && data.questions) || [];
    total = qs.length; doneCount = 0; score = 0;
    box.innerHTML = '';

    if (!qs.length) {
      box.innerHTML = '<p class="lead">这一期还没有题目哦。</p>';
      return;
    }

    qs.forEach(function (q, qi) {
      var correctIdx = q.options.findIndex(function (o) { return o.correct; });
      var card = document.createElement('div');
      card.className = 'ph-card';

      var optsHtml = q.options.map(function (o, i) {
        return '<button class="opt" data-correct="' + o.correct + '">' +
          '<b class="ph-k">' + LETTERS[i] + '</b>' + o.text + '</button>';
      }).join('');

      var lifeHtml = (q.life || []).map(function (t) { return '<li>' + t + '</li>'; }).join('');

      card.innerHTML =
        '<span class="pill blue">' + (q.hotspot || ('第 ' + (qi + 1) + ' 题')) + '</span>' +
        '<h3 class="ph-q">' + (qi + 1) + '. ' + q.question + '</h3>' +
        '<div class="opts">' + optsHtml + '</div>' +
        '<div class="ph-reveal">' +
          '<div class="feedback" style="margin-top:0">✅ 正确答案：' + LETTERS[correctIdx] + '</div>' +
          '<div class="ph-layer"><span class="ph-lt">👀 先看看现象</span><p>' + (q.phenomenon || '') + '</p></div>' +
          '<div class="ph-layer"><span class="ph-lt">🧠 为什么会这样 · 我们能怎么做</span><p>' + (q.why || '') + '</p></div>' +
          '<div class="ph-layer"><span class="ph-lt">🌍 生活里的它</span><ul>' + lifeHtml + '</ul></div>' +
          '<span class="pill mint">📚 知识点：' + (q.kp || '') + '</span>' +
        '</div>';

      box.appendChild(card);

      var optEls = card.querySelectorAll('.opt');
      var reveal = card.querySelector('.ph-reveal');
      optEls.forEach(function (el) {
        el.addEventListener('click', function () {
          if (card.dataset.done) return;
          card.dataset.done = '1';
          doneCount++;
          var isC = el.dataset.correct === 'true';
          if (isC) score++;
          optEls.forEach(function (o) {
            o.disabled = true;
            if (o.dataset.correct === 'true') o.classList.add('right');
            else if (o === el) o.classList.add('wrong');
          });
          reveal.classList.add('show');
          if (doneCount === total) showSummary();
        });
      });
    });
  }

  function showSummary() {
    if (!fb) return;
    fb.className = 'feedback ok';
    var msg = score === total ? '全对，物理小天才！🌟'
      : score >= Math.ceil(total * 0.6) ? '不错，继续保持～'
      : '再看一遍解析，下次更厉害！';
    fb.textContent = '🏁 本期 ' + total + ' 题答完 · 答对 ' + score + ' 题 · ' + msg;
  }

  loadManifest();
})();
