/* 学习长脑子 · 速算 / 冷知识卡片 / 知识闯关 */
(function () {
  'use strict';

  /* =========================================================
     1. 60 秒速算
     ========================================================= */
  (function mathTrain() {
    var qEl = document.getElementById('mtQ');
    var input = document.getElementById('mtInput');
    var timeEl = document.getElementById('mtTime');
    var rightEl = document.getElementById('mtRight');
    var bestEl = document.getElementById('mtBest');
    var bar = document.getElementById('mtBar');
    var fb = document.getElementById('mtFb');
    var startBtn = document.getElementById('mtStart');
    var skipBtn = document.getElementById('mtSkip');
    var levelSel = document.getElementById('mtLevel');
    if (!qEl) return;

    var answer = 0, right = 0, left = 60, timer = null, running = false;

    function showBest() {
      var b = BrainStore.get('mt.best.' + levelSel.value, null);
      bestEl.textContent = b === null ? '—' : b + ' 题';
    }

    function gen() {
      var lv = parseInt(levelSel.value, 10), a, b, c, txt;
      if (lv === 1) {
        a = randInt(11, 99); b = randInt(11, 99);
        if (Math.random() < .5) { txt = a + ' + ' + b; answer = a + b; }
        else { if (a < b) { var t = a; a = b; b = t; } txt = a + ' − ' + b; answer = a - b; }
      } else if (lv === 2) {
        if (Math.random() < .55) {
          a = randInt(3, 19); b = randInt(3, 12);
          txt = a + ' × ' + b; answer = a * b;
        } else {
          b = randInt(2, 12); answer = randInt(2, 15); a = b * answer;
          txt = a + ' ÷ ' + b;
        }
      } else {
        a = randInt(2, 12); b = randInt(2, 12); c = randInt(2, 30);
        if (Math.random() < .5) { txt = a + ' × ' + b + ' + ' + c; answer = a * b + c; }
        else { txt = a + ' × ' + b + ' − ' + c; answer = a * b - c; }
      }
      qEl.textContent = txt + ' = ?';
      input.value = '';
    }

    function tick() {
      left--;
      timeEl.textContent = left;
      bar.style.width = (left / 60 * 100) + '%';
      if (left <= 0) stop();
    }

    function start() {
      running = true; right = 0; left = 60;
      rightEl.textContent = '0'; timeEl.textContent = '60';
      bar.style.width = '100%';
      fb.textContent = ''; fb.className = 'feedback';
      input.disabled = false; skipBtn.disabled = false;
      startBtn.textContent = '重新开始';
      levelSel.disabled = true;
      input.focus();
      gen();
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }

    function stop() {
      clearInterval(timer); running = false;
      input.disabled = true; skipBtn.disabled = true;
      levelSel.disabled = false;
      startBtn.textContent = '再来一次';
      qEl.textContent = '时间到！';
      var isBest = BrainStore.best('mt.best.' + levelSel.value, right, false);
      showBest();
      var lvl = right >= 30 ? '计算器成精 🤖' : right >= 20 ? '非常厉害 🔥' : right >= 12 ? '不错，手感在线 👍' : '再练练，会越来越快 💪';
      fb.className = 'feedback ok';
      fb.textContent = '一分钟做对 ' + right + ' 题 · ' + lvl + (isBest ? ' 新纪录！' : '');
    }

    function submit() {
      if (!running) return;
      var v = parseInt(input.value, 10);
      if (isNaN(v)) return;
      if (v === answer) {
        right++; rightEl.textContent = right;
        fb.className = 'feedback ok'; fb.textContent = '✅ 对';
        gen();
      } else {
        fb.className = 'feedback no'; fb.textContent = '❌ 不对，再算一次';
        input.value = '';
      }
    }

    startBtn.onclick = start;
    skipBtn.onclick = function () { if (running) { fb.className = 'feedback'; fb.textContent = '跳过，答案是 ' + answer; gen(); input.focus(); } };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    levelSel.onchange = showBest;
    showBest();
  })();

  /* =========================================================
     2. 冷知识翻转卡片
     ========================================================= */
  (function cards() {
    var box = document.getElementById('cardList');
    if (!box) return;

    var DATA = [
      { t: '章鱼有 3 颗心脏', d: '两颗给鳃供血，一颗给全身。而且游泳时主心脏会停跳，所以章鱼更喜欢爬——游泳太累了。它的血还是蓝色的，因为含铜不含铁。' },
      { t: '香蕉是浆果，草莓不是', d: '植物学上，浆果要「由一个子房发育、果肉多籽」。香蕉、西瓜、番茄都算浆果；草莓表面那些小点才是真正的果实，红色部分是花托。' },
      { t: '光要走 8 分 20 秒才到地球', d: '太阳离我们约 1.5 亿公里。如果太阳此刻熄灭，我们还能再亮 8 分多钟才发现。你看到的太阳，永远是 8 分钟前的它。' },
      { t: '蜂蜜永远不会坏', d: '考古学家在埃及金字塔里发现过 3000 年前的蜂蜜，还能吃。因为它含水极少、酸性强，细菌根本活不下去。' },
      { t: '你身上的原子来自恒星', d: '除了氢，你体内的碳、氧、铁都是在恒星内部核聚变造出来的，恒星爆炸后散进宇宙。所以「我们都是星尘」这句话是字面意义上的真话。' },
      { t: '长颈鹿和人的颈椎一样多', d: '都是 7 块。长颈鹿只是每一块特别长，最长的接近 30 厘米。几乎所有哺乳动物的颈椎都是 7 块，树懒是少数例外。' },
      { t: '一天不是正好 24 小时', d: '地球自转一圈实际是 23 小时 56 分 4 秒。而且因为潮汐摩擦，地球在慢慢变慢，每过一百年白天大约长 1.8 毫秒。恐龙时代一天只有 23 小时。' },
      { t: '鲨鱼比树还古老', d: '鲨鱼出现在约 4 亿年前，树大约 3.9 亿年前才出现。鲨鱼还比土星环老——土星环可能只有 1 亿年历史。' },
      { t: '打喷嚏时心脏不会停', d: '这是最流行的谣言之一。打喷嚏会让胸腔压力骤变，心率短暂改变，但心脏一秒都没停过。' },
      { t: '金星上一天比一年长', d: '金星自转一圈要 243 个地球日，绕太阳一圈只要 225 天。而且它还是倒着转的——在金星上太阳从西边升起。' },
      { t: '人脑耗能占全身 20%', d: '大脑只占体重约 2%，却要吃掉五分之一的能量。这就是为什么用脑久了会想吃东西——它是真的饿。' },
      { t: '闪电的温度是太阳表面的 5 倍', d: '闪电通道瞬间可达 3 万摄氏度，太阳表面约 5500 度。周围空气被急速加热膨胀，炸出的声波就是雷声。' },
      { t: '蜗牛可以睡上三年', d: '在寒冷或干旱时，蜗牛会分泌黏液把自己封在壳里「夏眠」或「冬眠」，最长能连续睡三年。醒来第一件事就是找吃的。' },
      { t: '云其实重得像一头大象', d: '普通一小朵积云就含几百吨水，整片暴雨云可达几百万吨。它们能飘在空中，是因为水滴极细、被上升气流托着。' },
      { t: '人的指纹独一无二', d: '即使是同卵双胞胎，指纹也不一样。指纹在胎儿第 10 周开始形成，受子宫里羊水流动、位置等影响，所以是「天生的随机艺术」。' },
      { t: '树会「互相传话」', d: '当一棵柳树被毛毛虫啃，它会释放化学物质，让旁边的柳树提前产生苦味防御物质。植物之间确实会「通风报信」。' },
      { t: '相对论让 GPS 必须修正', d: '卫星跑得快、离地心远，时间比地面略快，每天差约 38 微秒。若不修正，GPS 定位一天就会偏出约 10 公里。' },
      { t: '水在 4℃ 时最重', d: '大多数物质越冷越重，但水在 4℃ 时密度最大。所以冰（0℃）浮在水面，湖底能保持 4℃ 不冻，鱼才能过冬。' },
      { t: '猫用胡须「量宽度」', d: '猫胡须的长度差不多等于它身体最宽处。钻洞前它先用胡须探两边，判断「我能不能过」。胡须根部布满神经，是超灵敏的触角。' },
      { t: '人的骨头比钢还「强」', d: '按单位重量算，骨头的抗压强度接近铸铁，比很多金属都硬。一根大腿骨立着能承受约 30 倍体重，比同重的钢柱还耐压。' },
      { t: '月球正在慢慢远离地球', d: '每年约 3.8 厘米。因为潮汐摩擦把地球自转的角动量传给了月球。几十亿年后，一天会变长到约 47 小时。' },
      { t: '彩虹其实是完整的圆', d: '从地面看是半弧，因为下半部分被地平线挡住。在飞机上或瀑布旁，有时能看到一整圈彩虹。' },
      { t: '蚂蚁能举起自己体重 50 倍', d: '换算成人体，相当于一个人单手举起一辆大卡车。秘密在于小型动物肌肉相对更粗、力量损耗更小。' },
      { t: '人的胃每几天换一层皮', d: '胃酸强到能溶解金属，所以胃壁细胞每 3–4 天就全部更新一次，不然自己就被消化掉了。' },
      { t: '音速在空气中约 340 米/秒', d: '所以打雷后数秒再听雷声，用秒数乘 340 就得雷闪距离（米）。先见光后闻声，就是因为光跑得比声音快得多。' }
    ];

    DATA.forEach(function (it) {
      var el = document.createElement('div');
      el.className = 'flip-card';
      el.innerHTML =
        '<div class="flip-in">' +
          '<div class="flip-f"><span class="pill sun">冷知识</span><h3 class="mt16">' + it.t + '</h3><div class="tip">点一下翻到背面 →</div></div>' +
          '<div class="flip-b"><p>' + it.d + '</p></div>' +
        '</div>';
      el.addEventListener('click', function () { el.classList.toggle('on'); });
      box.appendChild(el);
    });
  })();

  /* =========================================================
     3. 知识闯关
     ========================================================= */
  (function quiz() {
    var qEl = document.getElementById('qzQ');
    var tagEl = document.getElementById('qzTag');
    var optsEl = document.getElementById('qzOpts');
    var noEl = document.getElementById('qzNo');
    var scoreEl = document.getElementById('qzScore');
    var bestEl = document.getElementById('qzBest');
    var barEl = document.getElementById('qzBar');
    var fb = document.getElementById('qzFb');
    var nextBtn = document.getElementById('qzNext');
    var againBtn = document.getElementById('qzRestart');
    if (!qEl) return;

    var BANK = [
      { t: '成语', q: '「守株待兔」讽刺的是什么样的人？', o: ['勤劳肯干', '不知变通、妄想不劳而获', '深谋远虑', '见义勇为'], a: 1, w: '出自《韩非子》。农夫捡到一只撞死的兔子，就天天守着树桩等下一只，田也不种了。讽刺把偶然当必然的人。' },
      { t: '成语', q: '「胸有成竹」最早说的是谁画竹子？', o: ['王羲之', '文与可', '吴道子', '齐白石'], a: 1, w: '北宋画家文与可画竹前先在心里想好整棵竹子的样子。后来引申为做事前已有完整计划。' },
      { t: '科学', q: '为什么海水是咸的？', o: ['海底有盐矿在融化', '雨水冲刷陆地把盐带进海里，水蒸发盐留下', '鱼排出的盐分', '海水本来就自带咸味'], a: 1, w: '几十亿年来雨水溶解岩石中的矿物质冲入海洋，水不断蒸发升空，盐却留在海里越攒越多。' },
      { t: '科学', q: '声音在哪种介质里传得最快？', o: ['真空', '空气', '水', '钢铁'], a: 3, w: '介质越紧密声音越快：钢铁约 5000 m/s，水约 1500 m/s，空气约 340 m/s，真空里根本传不了——所以太空是绝对安静的。' },
      { t: '地理', q: '世界上最长的河流是？', o: ['长江', '亚马孙河', '尼罗河', '密西西比河'], a: 2, w: '尼罗河约 6650 公里，亚马孙河约 6400 公里但水量世界第一，长江约 6300 公里排第三。' },
      { t: '地理', q: '中国面积最大的省级行政区是？', o: ['西藏自治区', '新疆维吾尔自治区', '内蒙古自治区', '青海省'], a: 1, w: '新疆约 166 万平方公里，占全国六分之一，比西藏（约 120 万）还大。' },
      { t: '历史', q: '中国古代四大发明中，哪一项直接改变了航海？', o: ['造纸术', '印刷术', '指南针', '火药'], a: 2, w: '指南针让船在看不见陆地和星星时也能辨向，是远洋航行的前提，后来传入欧洲推动了大航海时代。' },
      { t: '历史', q: '「纸上谈兵」说的是哪位历史人物？', o: ['赵括', '项羽', '李广', '诸葛亮'], a: 0, w: '战国时赵括熟读兵书却毫无实战经验，长平之战代替廉颇领兵，导致赵军惨败。' },
      { t: '数学', q: '一个三角形的三个内角和一定等于？', o: ['90 度', '180 度', '360 度', '看形状而定'], a: 1, w: '在平面上永远是 180 度。但在球面上（比如地球仪）三角形内角和会大于 180 度——这是非欧几何。' },
      { t: '数学', q: '0.999999…（无限个 9）等于 1 吗？', o: ['等于 1', '略小于 1', '略大于 1', '无法确定'], a: 0, w: '严格等于 1。因为 1/3 = 0.333…，两边同乘 3 就得到 1 = 0.999…。这不是近似，是完全相等。' },
      { t: '生物', q: '人体最大的器官是什么？', o: ['肝脏', '大脑', '皮肤', '肺'], a: 2, w: '皮肤总面积约 1.5–2 平方米，重量约占体重 16%。它还是最大的免疫屏障。' },
      { t: '生物', q: '植物在晚上会做什么？', o: ['只进行光合作用', '只进行呼吸作用', '两种都停止', '两种都进行'], a: 1, w: '光合作用需要光，晚上停；呼吸作用一天 24 小时都在进行，会消耗氧气放出二氧化碳。' },
      { t: '科学', q: '彩虹为什么总是弧形的？', o: ['因为地球是圆的', '阳光在水滴里折射，同一角度的光才能进你眼睛', '因为云是弯的', '错觉，其实是直的'], a: 1, w: '阳光在雨滴中折射反射后，只有与太阳光约 42 度夹角的光能射入你的眼睛，这些方向连起来就是一个圆锥面——在地面上你只能看到上半个圆。' },
      { t: '语文', q: '「不以为然」的正确意思是？', o: ['不放在心上', '不认为是对的', '完全不在乎', '不知道怎么办'], a: 1, w: '「然」是「对、正确」。不以为然 = 不认为对，是表示不同意；「不以为意」才是不放在心上。这两个最容易混。' },
      { t: '科学', q: '为什么飞机能飞起来？', o: ['螺旋桨把它吹起来', '机翼上下气流速度不同产生压力差', '飞机比空气轻', '发动机向下喷气顶起来'], a: 1, w: '机翼上表面弯曲，气流走得快、压强小；下表面平，气流慢、压强大。上下压力差把飞机「吸」起来，这叫升力。' },
      { t: '成语', q: '「画蛇添足」告诉我们什么道理？', o: ['多做准备总没错', '多此一举反而坏事', '要认真画画', '团队合作重要'], a: 1, w: '有人给蛇添上脚，反而输了。比喻做了多余的事，不但无益反而坏事。' },
      { t: '成语', q: '「刻舟求剑」讽刺的是？', o: ['勇敢尝试', '不懂事物已变化、死守老办法', '勤奋练剑', '细心观察'], a: 1, w: '船在走、剑落水位置已变，还在船边刻记号找剑。讽刺拘泥成法、不知变通。' },
      { t: '科学', q: '彩虹通常有几种颜色？', o: ['3 种', '5 种', '7 种', '无数种，人眼只分辨出七色'], a: 3, w: '阳光是连续光谱，被水滴折射后人类大致分成红橙黄绿蓝靛紫七色，其实颜色是连续的。' },
      { t: '地理', q: '地球上最深的地方是？', o: ['马里亚纳海沟', '死海', '珠穆朗玛峰脚下', '大堡礁'], a: 0, w: '马里亚纳海沟最深处约 11034 米，把珠峰放进去还差两千多米才露出水面。' },
      { t: '地理', q: '一天里气温通常最高出现在？', o: ['正午 12 点', '下午 2 点左右', '日出时', '半夜'], a: 1, w: '正午太阳最高，但地面累积吸热到下午才最多，所以最热常在 14 点前后。' },
      { t: '历史', q: '万里长城最早大规模修建是为了？', o: ['观赏', '抵御北方游牧民族入侵', '划分省界', '引水灌溉'], a: 1, w: '从战国到秦，各诸侯国修长城阻挡游牧骑兵。秦统一后连成万里长城。' },
      { t: '历史', q: '活字印刷术是谁改进的？', o: ['蔡伦', '毕昇', '张衡', '祖冲之'], a: 1, w: '北宋毕昇用胶泥做活字，可重复排版印刷，比欧洲早约 400 年。' },
      { t: '数学', q: '圆周率 π 约等于？', o: ['2.72', '3.14', '1.41', '6.28'], a: 1, w: 'π 是圆周长与直径的比值，约 3.14159，是无理数，小数点后面永远不循环。' },
      { t: '数学', q: '一个数既是 2 的倍数又是 3 的倍数，它一定也是几的倍数？', o: ['4', '5', '6', '9'], a: 2, w: '能同时被 2 和 3 整除，就一定是它们最小公倍数 6 的倍数（如 6、12、18）。' },
      { t: '生物', q: '植物进行光合作用主要吸收哪种气体？', o: ['氧气', '氮气', '二氧化碳', '氢气'], a: 2, w: '叶子用阳光把二氧化碳和水变成糖和氧气。所以森林被称为「地球之肺」。' },
      { t: '生物', q: '人的血液为什么是红色的？', o: ['含铁的血红蛋白', '含铜', '染料', '温度高'], a: 0, w: '红细胞里的血红蛋白含铁，结合氧后呈鲜红。某些动物（如章鱼）含铜，血是蓝色的。' },
      { t: '语文', q: '「汗牛充栋」形容的是？', o: ['天气热', '藏书非常多', '牛很多', '房子大'], a: 1, w: '书多到搬它牛累出汗、放它塞满屋。专门形容藏书极丰富。' },
      { t: '语文', q: '「望梅止渴」出自谁的故事？', o: ['曹操', '刘备', '诸葛亮', '项羽'], a: 0, w: '曹操带兵缺水，说前面有梅林，士兵想到酸梅口水直流、暂解口渴。比喻用空想安慰自己。' },
      { t: '科学', q: '为什么先看到闪电后听到雷声？', o: ['眼睛比耳朵快', '光速远快于声速', '雷声被云挡住', '闪电在后产生'], a: 1, w: '光约 30 万千米/秒，声音约 340 米/秒，差了一百万倍，所以光先到、声后到。' },
      { t: '科学', q: '冰为什么能浮在水上？', o: ['它比水轻', '4℃ 的水密度最大，冰更轻', '有气泡', '风把它托着'], a: 1, w: '水在 4℃ 最重，结冰后体积变大、变轻，所以冰密度小于水，自然浮起来。' },
      { t: '地理', q: '中国最大的沙漠是？', o: ['塔克拉玛干沙漠', '撒哈拉沙漠', '戈壁', '毛乌素沙漠'], a: 0, w: '塔克拉玛干在新疆塔里木盆地，约 33 万平方公里，是中国最大、世界第二大的流动沙漠。' },
      { t: '生物', q: '蜜蜂用什么「跳舞」告诉同伴花在哪？', o: ['摇摆舞', '转圈舞', '两者都是', '不会跳舞'], a: 2, w: '蜜蜂用「摇摆舞」表示远处花的方向距离，用「圆圈舞」表示近处。这是真实的「蜜蜂语言」。' }
    ];

    var list = [], idx = 0, score = 0;

    function showBest() {
      var b = BrainStore.get('qz.best', null);
      bestEl.textContent = b === null ? '—' : b + '/10';
    }

    function start() {
      list = shuffle(BANK).slice(0, 10);
      idx = 0; score = 0;
      scoreEl.textContent = '0';
      againBtn.style.display = 'none';
      render();
      showBest();
    }

    function render() {
      var it = list[idx];
      noEl.textContent = idx + 1;
      barEl.style.width = (idx / 10 * 100) + '%';
      tagEl.textContent = it.t;
      qEl.textContent = it.q;
      fb.textContent = ''; fb.className = 'feedback';
      nextBtn.style.display = 'none';
      optsEl.innerHTML = '';

      it.o.forEach(function (text, i) {
        var b = document.createElement('button');
        b.className = 'opt';
        b.textContent = String.fromCharCode(65 + i) + '. ' + text;
        b.onclick = function () { answer(i); };
        optsEl.appendChild(b);
      });
    }

    function answer(i) {
      var it = list[idx];
      optsEl.querySelectorAll('.opt').forEach(function (x, j) {
        x.disabled = true;
        if (j === it.a) x.classList.add('right');
        else if (j === i) x.classList.add('wrong');
      });
      if (i === it.a) { score++; scoreEl.textContent = score; }
      fb.className = 'feedback ' + (i === it.a ? 'ok' : 'no');
      fb.textContent = (i === it.a ? '✅ 答对了！' : '❌ 正确答案是 ' + String.fromCharCode(65 + it.a) + ' · ') + it.w;
      nextBtn.style.display = 'inline-flex';
      nextBtn.textContent = idx === 9 ? '看结果 🏁' : '下一题 →';
    }

    nextBtn.onclick = function () {
      idx++;
      if (idx >= 10) finish();
      else render();
    };
    againBtn.onclick = start;

    function finish() {
      barEl.style.width = '100%';
      var isBest = BrainStore.best('qz.best', score, false);
      showBest();
      tagEl.textContent = '闯关结束';
      qEl.textContent = '🏁 你答对了 ' + score + ' / 10 题';
      optsEl.innerHTML = '';
      var lvl = score >= 9 ? '知识面惊人，去考大人吧 🏆' :
                score >= 7 ? '很不错，基础很扎实 👍' :
                score >= 5 ? '及格线以上，还有提升空间 💪' :
                '别灰心，每错一题就是学到一个新知识 🌱';
      fb.className = 'feedback ok';
      fb.textContent = lvl + (isBest ? ' · 新纪录！' : '');
      nextBtn.style.display = 'none';
      againBtn.style.display = 'inline-flex';
    }

    start();
  })();
})();
