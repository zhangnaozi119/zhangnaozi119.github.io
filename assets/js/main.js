/* 快快长脑子 · 全站公共脚本 */
(function () {
  'use strict';

  /* ---- 移动端导航 ---- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* ---- 通用 Tab 切换：[data-tabs] 容器内的 .tab[data-target] 与 .panel#id ---- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (box) {
      var tabs = box.querySelectorAll('.tab');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var id = tab.dataset.target;
          tabs.forEach(function (t) { t.classList.toggle('on', t === tab); });
          box.querySelectorAll('.panel').forEach(function (p) {
            p.classList.toggle('on', p.id === id);
          });
          window.dispatchEvent(new CustomEvent('tabchange', { detail: { id: id } }));
        });
      });
    });
  }

  /* ---- 本地小记录（最好成绩） ---- */
  window.BrainStore = {
    key: function (k) { return 'brain.' + k; },
    get: function (k, def) {
      try {
        var v = localStorage.getItem(this.key(k));
        return v === null ? def : JSON.parse(v);
      } catch (e) { return def; }
    },
    set: function (k, v) {
      try { localStorage.setItem(this.key(k), JSON.stringify(v)); } catch (e) {}
    },
    best: function (k, val, lowerIsBetter) {
      var cur = this.get(k, null);
      var better = cur === null ||
        (lowerIsBetter ? val < cur : val > cur);
      if (better) { this.set(k, val); return true; }
      return false;
    }
  };

  /* ---- 洗牌 ---- */
  window.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  window.randInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  /* ---- 当前页导航高亮 ---- */
  function markActive() {
    var path = location.pathname.split('/').pop() || 'index.html';
    if (!path || path.endsWith('/')) path = 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === path) a.classList.add('on');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initTabs();
    markActive();
  });
})();
