/* =====================================================================
   PORTFOLIO · Shared behaviors + reusable data-ops demo helpers
   Zero external dependencies.
   Behaviors: particle bg, scroll progress, nav spy, reveal, count-up,
   hero typewriter, hub-back.
   Helpers (window.PD): funnel, AB, EventStream, Retention, RFM,
   DotField, Sparkline, Bars, Dashboard.
   ===================================================================== */
(function(){
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- particle network background ---------- */
  (function particles(){
    var c = document.getElementById('bg-particles');
    if(!c) return;
    var ctx = c.getContext('2d'), w, h, pts = [], dpr = Math.min(window.devicePixelRatio||1, 2);
    // theme-aware palette: teal/navy in light mode, glowing cyan/sky in dark mode
    function palette(){
      var dark = (document.documentElement.getAttribute('data-theme')||'light')==='dark';
      return dark
        ? { dot:'rgba(34,211,238,0.55)', line:function(a){ return 'rgba(56,189,248,'+a+')'; } }
        : { dot:'rgba(14,116,144,0.5)',  line:function(a){ return 'rgba(30,64,100,'+a+')'; } };
    }
    var col = palette();
    if(typeof MutationObserver!=='undefined'){
      new MutationObserver(function(){ col = palette(); if(reduce) draw(); }).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
    }
    function resize(){
      w = c.width = Math.floor(innerWidth*dpr);
      h = c.height = Math.floor(innerHeight*dpr);
      c.style.width = innerWidth+'px'; c.style.height = innerHeight+'px';
      var count = Math.min(90, Math.floor(innerWidth*innerHeight/16000));
      pts = [];
      for(var i=0;i<count;i++){ pts.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*0.22*dpr,vy:(Math.random()-.5)*0.22*dpr,r:(Math.random()*1.6+0.6)*dpr}); }
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      var R = 130*dpr;
      for(var i=0;i<pts.length;i++){
        var p = pts[i];
        if(!reduce){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w) p.vx*=-1; if(p.y<0||p.y>h) p.vy*=-1; }
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fillStyle=col.dot; ctx.fill();
        for(var j=i+1;j<pts.length;j++){
          var q=pts[j], dx=p.x-q.x, dy=p.y-q.y, d=Math.sqrt(dx*dx+dy*dy);
          if(d<R){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.strokeStyle=col.line(0.12*(1-d/R)); ctx.lineWidth=1; ctx.stroke(); }
        }
      }
    }
    function loop(){ draw(); rafId = requestAnimationFrame(loop); }
    var rafId = null;
    function onVis(){ if(document.hidden){ if(rafId) cancelAnimationFrame(rafId); rafId=null; } else if(rafId===null && !reduce){ rafId = requestAnimationFrame(loop); } }
    resize(); addEventListener('resize', resize);
    if(reduce){ draw(); addEventListener('resize', draw); }   // 静态单帧：尊重 prefers-reduced-motion
    else { loop(); document.addEventListener('visibilitychange', onVis); }   // 后台标签页暂停，省电
  })();

  /* ---------- scroll progress ---------- */
  (function(){
    var bar = document.getElementById('scroll-progress');
    if(!bar) return;
    function upd(){ var st=document.documentElement.scrollTop||document.body.scrollTop; var sh=(document.documentElement.scrollHeight-document.documentElement.clientHeight)||1; bar.style.width=Math.min(100,st/sh*100)+'%'; }
    addEventListener('scroll', upd, {passive:true}); upd();
  })();

  /* ---------- nav scroll-spy + smooth scroll ---------- */
  (function(){
    var links = Array.prototype.slice.call(document.querySelectorAll('nav a[href^="#"]'));
    if(!links.length) return;
    var map = {};
    links.forEach(function(a){
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if(sec) map[id] = a;
      a.addEventListener('click', function(e){ if(sec){ e.preventDefault(); sec.scrollIntoView({behavior: reduce?'auto':'smooth'}); } });
    });
    var ids = Object.keys(map);
    function spy(){
      var pos = (document.documentElement.scrollTop||document.body.scrollTop) + 140;
      var cur = ids[0];
      ids.forEach(function(id){ var s=document.getElementById(id); if(s && s.offsetTop<=pos) cur=id; });
      links.forEach(function(a){ a.classList.toggle('active', a===map[cur]); });
    }
    addEventListener('scroll', spy, {passive:true}); spy();
  })();

  /* ---------- reveal on scroll ---------- */
  (function(){
    var els = document.querySelectorAll('.reveal');
    if(!els.length || !('IntersectionObserver' in window)){ Array.prototype.forEach.call(els,function(e){e.classList.add('in');}); return; }
    var obs = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } }); }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    Array.prototype.forEach.call(els,function(e){ obs.observe(e); });
  })();

  /* ---------- skill bars (animate fill + count-up number from left) ---------- */
  (function(){
    var bars = document.querySelectorAll('.skill-bar-fill[data-w]');
    if(!bars.length) return;
    function numSpan(b){ var w = b.closest ? b.closest('.skill-bar-wrap') : null; return w ? w.querySelector('.skill-bar-label span:last-child') : null; }
    function fmtNum(span, target){
      if(!span) return;
      if(reduce){ span.textContent = target + '%'; return; }
      var dur = 1300, t0 = null;
      function tick(ts){ if(!t0) t0 = ts; var p = Math.min(1,(ts-t0)/dur); var e = 1-Math.pow(1-p,3); span.textContent = Math.round(target*e) + '%'; if(p<1) requestAnimationFrame(tick); else span.textContent = target + '%'; }
      requestAnimationFrame(tick);
    }
    function run(b){
      b.style.width = b.dataset.w + '%';
      fmtNum(numSpan(b), parseInt(b.dataset.w,10));
    }
    // zero the numbers immediately so they count up on reveal (no flash of final value)
    Array.prototype.forEach.call(bars, function(b){ var n=numSpan(b); if(n) n.textContent='0%'; });
    if(!('IntersectionObserver' in window)){ Array.prototype.forEach.call(bars, run); return; }
    var obs = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ run(e.target); obs.unobserve(e.target); } }); }, {threshold:0.3});
    Array.prototype.forEach.call(bars, function(b){ obs.observe(b); });
  })();

  /* ---------- KPI count-up ---------- */
  (function(){
    var nums = document.querySelectorAll('[data-count]');
    if(!nums.length) return;
    function fmt(v, el){
      var t = parseFloat(el.dataset.count);
      var dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
      var base;
      if(el.dataset.suffix==='万'){ base = (v/10000).toFixed(1)+'万'; }
      else if(t>=1000 && !dec){ base = Math.round(v).toLocaleString('en-US'); }
      else { base = v.toFixed(dec); }
      if(el.dataset.suffix && el.dataset.suffix!=='万'){ base += el.dataset.suffix; }
      return base;
    }
    function run(el){
      var target = parseFloat(el.dataset.count);
      var dec = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
      var dur = 1500, t0 = null;
      function tick(ts){ if(!t0) t0=ts; var p=Math.min(1,(ts-t0)/dur); var eased=1-Math.pow(1-p,3); el.textContent=fmt(target*eased, el); if(p<1) requestAnimationFrame(tick); else el.textContent=fmt(target, el); }
      requestAnimationFrame(tick);
    }
    if(!('IntersectionObserver' in window)){ Array.prototype.forEach.call(nums,run); return; }
    var obs = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ run(e.target); obs.unobserve(e.target); } }); }, {threshold:0.4});
    Array.prototype.forEach.call(nums,function(n){ obs.observe(n); });
  })();

  /* ---------- hero typewriter ---------- */
  (function(){
    var el = document.querySelector('[data-typed]');
    if(!el) return;
    var arr; try { arr = JSON.parse(el.getAttribute('data-typed')); } catch(e){ arr = [el.textContent]; }
    if(!Array.isArray(arr)) arr=[arr];
    if(reduce){ el.textContent = arr[0]; return; }
    var ti=0, ci=0, deleting=false;
    function tick(){
      var txt = arr[ti]; el.textContent = txt.slice(0, ci);
      if(!deleting){ ci++; if(ci>txt.length){ deleting=true; setTimeout(tick, 1800); return; } setTimeout(tick, 38+Math.random()*30); }
      else { ci--; if(ci<0){ deleting=false; ci=0; ti=(ti+1)%arr.length; setTimeout(tick, 420); return; } setTimeout(tick, 18); }
    }
    tick();
  })();

  /* ---------- hub-back visibility ---------- */
  (function(){
    var b = document.querySelector('.hub-back');
    if(!b) return;
    function upd(){ b.style.opacity = (document.documentElement.scrollTop||document.body.scrollTop)>200 ? '1':'0'; }
    addEventListener('scroll', upd, {passive:true}); upd();
  })();

  /* ---------- preloader ---------- */
  (function(){
    var pl = document.getElementById('preloader');
    if(!pl) return;
    var fill = pl.querySelector('.pl-fill'), pct = pl.querySelector('.pl-pct');
    var p = 0, done = false;
    function finish(){ if(done) return; done = true; pl.classList.add('done'); document.body.classList.add('loaded'); }
    var timer = setInterval(function(){
      p = Math.min(100, p + Math.random()*16 + 7);
      if(fill) fill.style.width = p+'%';
      if(pct) pct.textContent = Math.floor(p)+'%';
      if(p>=100){ clearInterval(timer); setTimeout(finish, 260); }
    }, 110);
    // safety: never trap the user behind the loader
    addEventListener('load', function(){ setTimeout(finish, 200); });
    setTimeout(finish, 2600);
  })();

  /* ---------- mobile nav drawer ---------- */
  (function(){
    var toggle = document.querySelector('.nav-toggle');
    var inner = document.querySelector('.nav-inner');
    var overlay = document.querySelector('.nav-overlay');
    if(!toggle || !inner) return;
    function close(){ inner.classList.remove('open'); toggle.classList.remove('open'); if(overlay) overlay.classList.remove('open'); }
    toggle.addEventListener('click', function(){ var open = inner.classList.toggle('open'); toggle.classList.toggle('open', open); if(overlay) overlay.classList.toggle('open', open); });
    if(overlay) overlay.addEventListener('click', close);
    Array.prototype.forEach.call(inner.querySelectorAll('a'), function(a){ a.addEventListener('click', close); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
  })();

  /* ---------- scroll to top ---------- */
  (function(){
    var st = document.getElementById('scroll-top');
    if(!st) return;
    function upd(){ st.classList.toggle('show', (document.documentElement.scrollTop||document.body.scrollTop)>520); }
    addEventListener('scroll', upd, {passive:true}); upd();
    st.addEventListener('click', function(){ window.scrollTo({top:0, behavior: reduce?'auto':'smooth'}); });
  })();

  /* ---------- 3D tilt micro-interaction ---------- */
  (function(){
    if(reduce) return;
    var cards = document.querySelectorAll('[data-tilt]');
    if(!cards.length) return;
    Array.prototype.forEach.call(cards, function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left)/r.width - 0.5;
        var y = (e.clientY - r.top)/r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX('+(-y*4.5).toFixed(2)+'deg) rotateY('+(x*4.5).toFixed(2)+'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform=''; });
    });
  })();

  /* ====================== DATA-OPS HELPERS ====================== */
  // theme-aware canvas colors (read live so they follow the dark/light switch)
  function themeCanvas(){
    var cs = getComputedStyle(document.documentElement);
    return {
      bg:   (cs.getPropertyValue('--canvas-bg').trim()   || '#f8fafc'),
      grid: (cs.getPropertyValue('--canvas-grid').trim() || 'rgba(15,23,42,.07)'),
      axis: (cs.getPropertyValue('--canvas-axis').trim() || 'rgba(71,85,105,.75)')
    };
  }
  var PD = window.PD = {};

  /* Funnel (DOM-based, responsive) */
  PD.funnel = function(el, stages){
    if(typeof el==='string') el = document.getElementById(el);
    if(!el) return;
    el.innerHTML = '';
    var max = stages[0].value;
    stages.forEach(function(s, i){
      var prev = i===0 ? null : stages[i-1].value;
      var w = Math.max(2, s.value/max*100);
      var rate = prev ? (s.value/prev*100).toFixed(1)+'%' : '基准';
      var row = document.createElement('div'); row.className = 'funnel-row';
      row.innerHTML = '<div class="funnel-label">'+s.label+'</div>'+
        '<div class="funnel-bar" style="width:'+w+'%">'+s.value.toLocaleString()+'</div>'+
        '<div class="funnel-rate">'+rate+'</div>';
      el.appendChild(row);
    });
  };

  /* A/B test simulator */
  PD.AB = function(opts){
    var mount = typeof opts.mount==='string' ? document.getElementById(opts.mount) : opts.mount;
    if(!mount) return;
    var variants = opts.variants; // [{name,color,trueRate}]
    var rounds = opts.rounds || 300;
    mount.innerHTML =
      '<div class="ab-grid" id="ab-grid"></div>'+
      '<div class="btn-group" style="margin-top:14px"><button class="btn btn-primary" id="ab-run">▶ 运行实验</button><button class="btn" id="ab-reset">↻ 重置</button></div>'+
      '<div class="ab-verdict" id="ab-verdict">点击运行，模拟流量分配与显著性检验（z-test, α=0.05）。</div>';
    var grid = mount.querySelector('#ab-grid');
    var verdict = mount.querySelector('#ab-verdict');
    var state = variants.map(function(){ return {n:0, c:0}; });
    function render(){
      grid.innerHTML = '';
      variants.forEach(function(v, i){
        var s = state[i];
        var rate = s.n ? (s.c/s.n*100) : 0;
        var card = document.createElement('div'); card.className='ab-variant';
        card.innerHTML = '<h4><span class="dot" style="background:'+v.color+'"></span>'+v.name+'</h4>'+
          '<div class="ab-rate">'+rate.toFixed(2)+'%</div>'+
          '<div class="ab-sub">样本 '+s.n.toLocaleString()+' · 转化 '+s.c.toLocaleString()+'</div>';
        grid.appendChild(card);
      });
    }
    function bern(p){ return Math.random() < p ? 1 : 0; }
    function normCdf(x){ var t=1/(1+0.2316419*Math.abs(x)); var d=0.3989423*Math.exp(-x*x/2); var prob=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274)))); return x>0 ? 1-prob : prob; }
    function ztest(){
      var a = state[0], b = state[1];
      if(!a.n||!b.n) return {z:0,p:1,lift:0};
      var pa = a.c/a.n, pb = b.c/b.n;
      var se = Math.sqrt(pa*(1-pa)/a.n + pb*(1-pb)/b.n);
      if(se===0) return {z:0, p:1, lift:0};
      var z = (pb-pa)/se;
      return {z:z, p:2*(1-normCdf(Math.abs(z))), lift:(pb-pa)*100};
    }
    function summarize(){
      var r = ztest();
      var ra = state[0].n?state[0].c/state[0].n:0, rb = state[1].n?state[1].c/state[1].n:0;
      var winner = rb>ra ? variants[1].name : variants[0].name;
      var sig = r.p < 0.05;
      verdict.innerHTML = '样本量 '+ (state[0].n+state[1].n).toLocaleString() +
        ' · 提升 <b>'+r.lift.toFixed(2)+' pp</b> · z='+r.z.toFixed(2)+' · p='+r.p.toFixed(3)+
        (sig ? ' · <b>统计显著 ✅</b> 推荐 '+winner : ' · 尚未显著，继续累积样本');
      render();
    }
    mount.querySelector('#ab-run').onclick = function(){
      for(var i=0;i<rounds;i++){ variants.forEach(function(v, vi){ state[vi].n += 1; if(bern(v.trueRate)) state[vi].c += 1; }); }
      summarize();
    };
    mount.querySelector('#ab-reset').onclick = function(){
      state = variants.map(function(){ return {n:0,c:0}; }); render();
      verdict.textContent='已重置。点击运行开始模拟。';
    };
    render();
  };

  /* Live event stream (operations feed) */
  PD.EventStream = function(el, opts){
    opts = opts || {};
    if(typeof el==='string') el = document.getElementById(el);
    if(!el) return;
    var verbs = opts.verbs || ['新用户注册','页面浏览','加入购物车','发起支付','分享裂变','留存回访','领取优惠券'];
    var max = opts.max || 9;
    function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
    function tick(){
      var e = document.createElement('div');
      e.style.cssText='font-family:var(--font-mono);font-size:11px;padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:8px;color:var(--text-dim)';
      var t = new Date().toLocaleTimeString('en-GB');
      var accent = Math.random()>0.5 ? 'var(--cyan)' : 'var(--emerald)';
      e.innerHTML = '<span style="color:'+accent+'">'+t+'</span><span style="color:var(--text)">'+pick(verbs)+'</span><span style="margin-left:auto;color:var(--text-faint)">#'+Math.floor(Math.random()*9000+1000)+'</span>';
      el.insertBefore(e, el.firstChild);
      while(el.children.length>max) el.removeChild(el.lastChild);
    }
    setInterval(tick, opts.interval || 950);
    for(var i=0;i<max;i++) tick();
  };

  /* Retention curve */
  PD.Retention = function(canvas, weeks){
    var ctx = canvas.getContext('2d'); var W=canvas.width, H=canvas.height;
    var cv = themeCanvas();
    ctx.fillStyle=cv.bg; ctx.fillRect(0,0,W,H);
    var pad=34, n=weeks.length;
    ctx.strokeStyle=cv.grid; ctx.lineWidth=1;
    for(var g=0;g<=4;g++){ var y=pad+(H-2*pad)*g/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-10,y); ctx.stroke(); }
    ctx.fillStyle=cv.axis; ctx.font='9px monospace'; ctx.textAlign='right';
    for(var g2=0;g2<=4;g2++){ ctx.fillText((100-g2*25)+'%',pad-4,pad+(H-2*pad)*g2/4+3); }
    ctx.beginPath();
    weeks.forEach(function(v,i){ var x=pad+(W-pad-10)*i/(n-1); var y=pad+(H-2*pad)*(1-v/100); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    var grad=ctx.createLinearGradient(0,pad,0,H-pad); grad.addColorStop(0,'rgba(8,145,178,.3)'); grad.addColorStop(1,'rgba(8,145,178,0)');
    ctx.lineTo(W-10,H-pad); ctx.lineTo(pad,H-pad); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
    ctx.beginPath();
    weeks.forEach(function(v,i){ var x=pad+(W-pad-10)*i/(n-1); var y=pad+(H-2*pad)*(1-v/100); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.strokeStyle='#0891b2'; ctx.lineWidth=2.5; ctx.stroke();
    weeks.forEach(function(v,i){
      var x=pad+(W-pad-10)*i/(n-1); var y=pad+(H-2*pad)*(1-v/100);
      ctx.beginPath(); ctx.arc(x,y,3,0,6.283); ctx.fillStyle='#0891b2'; ctx.fill();
      ctx.fillStyle='rgba(71,85,105,.75)'; ctx.font='9px monospace'; ctx.textAlign='center';
      ctx.fillText('W'+i, x, H-pad+14);
    });
  };

  /* RFM scatter */
  PD.RFM = function(canvas, points){
    var ctx = canvas.getContext('2d'); var W=canvas.width, H=canvas.height;
    var cv = themeCanvas();
    ctx.fillStyle=cv.bg; ctx.fillRect(0,0,W,H);
    var pad=30;
    ctx.strokeStyle=cv.grid; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,H-pad); ctx.lineTo(W-10,H-pad); ctx.stroke();
    ctx.fillStyle=cv.axis; ctx.font='9px monospace';
    ctx.textAlign='center'; ctx.fillText('F 频率 →', (W+pad)/2, H-6);
    ctx.save(); ctx.translate(10,H/2); ctx.rotate(-Math.PI/2); ctx.fillText('M 金额 →', 0,0); ctx.restore();
    points.forEach(function(p){
      var x = pad + (W-pad-10)*p.f;
      var y = H-pad - (H-2*pad)*p.m;
      var r = 3 + p.r*7;
      ctx.beginPath(); ctx.arc(x,y,r,0,6.283);
      ctx.fillStyle = p.color; ctx.globalAlpha=.7; ctx.fill(); ctx.globalAlpha=1;
      ctx.strokeStyle='rgba(15,23,42,.12)'; ctx.lineWidth=1; ctx.stroke();
    });
  };

  /* Behavior dot-field (heatmap-ish) */
  PD.DotField = function(canvas, opts){
    opts = opts || {};
    var ctx = canvas.getContext('2d'); var W=canvas.width, H=canvas.height;
    var cols = opts.cols || 24, rows = opts.rows || 12;
    var hot = opts.hot || [[4,3],[5,3],[4,4],[12,6],[13,6],[18,8],[19,8]];
    var hotSet = {}; hot.forEach(function(h){ hotSet[h[0]+','+h[1]]=true; });
    var t=0;
    function draw(){
      ctx.fillStyle=themeCanvas().bg; ctx.fillRect(0,0,W,H);
      var cw = W/cols, ch = H/rows;
      for(var r=0;r<rows;r++){
        for(var c=0;c<cols;c++){
          var x=c*cw+cw/2, y=r*ch+ch/2;
          var base = hotSet[c+','+r] ? 1 : (Math.sin((c+r+t)*0.6)*0.5+0.5)*0.35;
          var alpha = 0.15 + base*0.85;
          var rad = hotSet[c+','+r] ? cw*0.34 : cw*0.18;
          ctx.beginPath(); ctx.arc(x,y,rad,0,6.283);
          ctx.fillStyle = 'rgba(8,145,178,'+alpha.toFixed(3)+')';
          if(hotSet[c+','+r]) ctx.fillStyle = 'rgba(190,24,93,'+alpha.toFixed(3)+')';
          ctx.fill();
        }
      }
      t += 0.05;
      requestAnimationFrame(draw);
    }
    draw();
  };

  /* Sparkline (small trend) */
  PD.Sparkline = function(canvas, series, color){
    var ctx = canvas.getContext('2d'); var W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    var min=Math.min.apply(null,series), max=Math.max.apply(null,series), span=(max-min)||1, n=series.length;
    ctx.beginPath();
    series.forEach(function(v,i){ var x=i*(W)/(n-1); var y=H-4-((v-min)/span)*(H-8); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.strokeStyle=color||'#0891b2'; ctx.lineWidth=2; ctx.stroke();
  };

  /* Horizontal bars (simple KPI list) */
  PD.Bars = function(canvas, items, color){
    var ctx = canvas.getContext('2d'); var W=canvas.width, H=canvas.height;
    var cv = themeCanvas();
    ctx.fillStyle=cv.bg; ctx.fillRect(0,0,W,H);
    var max = Math.max.apply(null, items.map(function(i){return i.value;}))||1;
    var bh = (H-20)/items.length;
    items.forEach(function(it,i){
      var y=10+i*bh, bw=(W-120)*(it.value/max);
      var g=ctx.createLinearGradient(80,0,80+bw,0); g.addColorStop(0,color||'#0891b2'); g.addColorStop(1,'rgba(124,58,237,.5)');
      ctx.fillStyle=g; ctx.fillRect(80,y+3,bw,bh-6);
      ctx.fillStyle=cv.axis; ctx.font='10px monospace'; ctx.textAlign='right'; ctx.fillText(it.label,74,y+bh/2+3);
      ctx.fillStyle=cv.axis; ctx.textAlign='left'; ctx.fillText(it.value,86+bw,y+bh/2+3);
    });
  };

  /* Dashboard helper: ticks a set of KPI numbers by id with jitter */
  PD.Dashboard = function(mapping){
    var keys = Object.keys(mapping);
    function tick(){
      keys.forEach(function(id){
        var el = document.getElementById(id); if(!el) return;
        var conf = mapping[id];
        var v = conf.base + (Math.random()-0.5)*conf.jitter;
        el.textContent = (conf.prefix||'') + v.toFixed(conf.dec||0) + (conf.suffix||'');
      });
    }
    setInterval(tick, 1200); tick();
  };

  /* ---------- theme toggle (dark / light) ---------- */
  (function(){
    var KEY = 'pf-theme';
    function apply(t){ document.documentElement.setAttribute('data-theme', t); }
    function current(){ return document.documentElement.getAttribute('data-theme') || 'light'; }
    function paint(btn){
      var dark = current()==='dark';
      btn.textContent = dark ? '☀️' : '🌙';
      btn.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
      btn.title = dark ? '切换到浅色模式' : '切换到深色模式';
    }
    function init(){
      var btn = document.getElementById('themeToggle');
      if(!btn) return;
      paint(btn);
      btn.addEventListener('click', function(){
        var t = current()==='dark' ? 'light' : 'dark';
        apply(t);
        try{ localStorage.setItem(KEY, t); }catch(e){}
        paint(btn);
      });
    }
    if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
  })();

  console.log('%c[PORTFOLIO]%c premium light theme loaded · zero dependencies',
    'color:#0891b2;font-weight:700','color:#475569');

  /* ---------- site-wide floating "导出 PDF" button ---------- */
  (function(){
    if(window.location.search.indexOf('noprint') > -1) return;
    var b = document.createElement('button');
    b.className = 'float-print';
    b.type = 'button';
    b.setAttribute('aria-label', '导出 PDF');
    b.title = '导出 / 打印当前页面为 PDF';
    b.innerHTML = '🖨 导出 PDF';
    b.addEventListener('click', function(){ window.print(); });
    document.body.appendChild(b);
  })();
})();

/* ---------- project galleries + resume switch (injected) ---------- */
(function(){
  var PROJECTS = {
    'pyconometrics':       {name:'pyconometrics',       tag:'计量经济', desc:'从零实现的计量经济学库：OLS / IV / DID / RDD 等因果识别方法与诊断，纯 Python 依赖。', lang:'Python', rc:'#3572A5', stars:0, fork:0, upd:'2026-06', github:'https://github.com/wzx11223344/pyconometrics'},
    'quantlab':            {name:'quantlab',            tag:'量化金融', desc:'量化工具箱：BS 期权定价、Greeks 风险度量、回测框架与组合分析，覆盖金融工程基础能力。', lang:'Python', rc:'#f59e0b', stars:0, fork:0, upd:'2026-07', github:'https://github.com/wzx11223344/quantlab'},
    'dsgepy':              {name:'dsgepy',              tag:'宏观建模', desc:'一般均衡建模工具：RBC / NK / B-K 等 DSGE 模型的求解与脉冲响应分析。', lang:'Python', rc:'#0EA5E9', stars:0, fork:0, upd:'2026-06', github:'https://github.com/wzx11223344/dsgepy'},
    'macrodatahub':        {name:'macrodatahub',        tag:'宏观数据', desc:'宏观经济数据平台：对接 WB / FRED / 国家统计局等多源数据，统一接口与清洗流程。', lang:'Python', rc:'#10b981', stars:0, fork:0, upd:'2026-06', github:'https://github.com/wzx11223344/macrodatahub'},
    'policysim':           {name:'policysim',           tag:'政策模拟', desc:'政策模拟框架：ABM / DID / SC 多方法对比，支持产业政策与冲击的情景推演。', lang:'Python', rc:'#8b5cf6', stars:0, fork:0, upd:'2026-06', github:'https://github.com/wzx11223344/policysim'},
    'city-compare':        {name:'city-compare',        tag:'城市分析', desc:'城市对标分析：50 城 8 维指标聚类与可视化，用于区域与产业比较研究。', lang:'Python', rc:'#ec4899', stars:0, fork:0, upd:'2026-07', github:'https://github.com/wzx11223344/city-compare'},
    'express-consumption': {name:'express-consumption', tag:'实证研究', desc:'正大杯全国大赛 1,352 份问卷计量建模可复现代码（LPM / Logistic / 回归），完整数据处理 pipeline。', lang:'Python', rc:'#ef4444', stars:0, fork:0, upd:'2026-06', github:'https://github.com/wzx11223344/express-consumption'},
    'causal-inference-ml': {name:'causal-inference-ml', tag:'因果推断', desc:'因果机器学习方法：Double ML / Causal Forest，衔接计量经济学与现代 ML 估计。', lang:'Python', rc:'#14b8a6', stars:1, fork:0, upd:'2026-06', github:'https://github.com/wzx11223344/causal-inference-ml'},
    'mcp-financial-data':  {name:'mcp-financial-data',  tag:'AI 工程',  desc:'金融数据 MCP 服务器：把行情、财报、宏观等数据能力封装为 Agent 可调用的标准接口。', lang:'Python', rc:'#6366f1', stars:0, fork:0, upd:'2026-07', github:'https://github.com/wzx11223344/mcp-financial-data'},
    'econ-dashboard':      {name:'econ-dashboard',      tag:'经济看板', desc:'交互式经济数据看板：GDP/CPI/PMI 跨国对比与宏观趋势可视化，Streamlit 多页面应用。', lang:'Python', rc:'#0EA5E9', stars:0, fork:0, upd:'2026-07', github:'https://github.com/wzx11223344/econ-dashboard'}
  };
  var MONO = {
    'pyconometrics':'PY','quantlab':'QU','dsgepy':'DS','macrodatahub':'MA','policysim':'PO',
    'city-compare':'CI','express-consumption':'EX','causal-inference-ml':'CA','mcp-financial-data':'MC','econ-dashboard':'EC'
  };
  var RELATED = {
    'pyconometrics':       ['quantlab','causal-inference-ml','econ-dashboard','dsgepy'],
    'quantlab':            ['pyconometrics','econ-dashboard','mcp-financial-data','dsgepy'],
    'dsgepy':              ['pyconometrics','quantlab','macrodatahub','policysim'],
    'macrodatahub':        ['econ-dashboard','dsgepy','city-compare','policysim'],
    'policysim':           ['dsgepy','macrodatahub','city-compare','express-consumption'],
    'city-compare':        ['macrodatahub','causal-inference-ml','express-consumption','econ-dashboard'],
    'express-consumption': ['causal-inference-ml','city-compare','econ-dashboard','macrodatahub'],
    'causal-inference-ml': ['pyconometrics','express-consumption','city-compare','econ-dashboard'],
    'mcp-financial-data':  ['quantlab','econ-dashboard','pyconometrics','macrodatahub'],
    'econ-dashboard':      ['quantlab','macrodatahub','city-compare','pyconometrics']
  };
  var POS_PROJECTS = {
    'bank':    ['quantlab','econ-dashboard','mcp-financial-data','dsgepy','pyconometrics'],
    'internet':['econ-dashboard','macrodatahub','express-consumption','city-compare','causal-inference-ml']
  };
  var RESUMES = {
    'general': {pdf:'resumes/general-resume.pdf', docx:'resumes/general-resume.docx', page:'general.html', label:'通用'},
    'bank':    {pdf:'resumes/bank-resume.pdf',    docx:'resumes/bank-resume.docx',    page:'bank.html',    label:'银行'},
    'finance': {pdf:'resumes/finance-resume.pdf', docx:'resumes/finance-resume.docx', page:'finance.html', label:'财务/金融'},
    'state':   {pdf:'resumes/state-resume.pdf',   docx:'resumes/state-resume.docx',   page:'state.html',   label:'国企政府'},
    'internet':{pdf:'resumes/internet-resume.pdf',docx:'resumes/internet-resume.docx',page:'internet.html',label:'互联网运营'},
    'hr':      {pdf:'resumes/hr-resume.pdf',      docx:'resumes/hr-resume.docx',      page:'hr.html',      label:'人事'}
  };

  function card(s){
    var p = PROJECTS[s]; if(!p) return '';
    var page = '../projects/' + s + '.html';
    var gh = (window.GH_DATA && window.GH_DATA[s]) || null;   // 优先用真实 GitHub 数据，与详情页一致
    var stars = gh ? gh.stars : p.stars;
    var star = stars > 0 ? ('★ ' + stars) : '🌱 新建';
    var fork = p.fork > 0 ? ('⑂ ' + p.fork) : '🔧 可复刻';
    return '<div class="proj-card">'
      + '<div class="proj-thumb" style="--rc:' + p.rc + '"><span class="pt-mono">' + (MONO[s] || s.slice(0,2).toUpperCase()) + '</span><span class="pt-name">' + p.name + '</span><span class="pt-lang">' + p.lang + '</span></div>'
      + '<div class="proj-top"><span class="proj-name">' + p.name + '</span><span class="proj-tag">' + p.tag + '</span></div>'
      + '<div class="proj-desc">' + p.desc + '</div>'
      + '<div class="proj-meta"><a href="' + p.github + '" target="_blank">↗ 源码</a> <a class="proj-detail" href="' + page + '">查看详情 →</a><span>· ' + p.lang + '</span><span class="repo-stat"><b>' + star + '</b><span class="dot"></span><b>' + fork + '</b><span class="dot"></span>更新 ' + p.upd + '</span></div>'
      + '</div>';
  }
  function fillGalleries(){
    var nodes = document.querySelectorAll('[data-gallery]');
    for(var i=0;i<nodes.length;i++){
      var n = nodes[i];
      var mode = n.getAttribute('data-gallery');
      var key = n.getAttribute('data-project') || n.getAttribute('data-position');
      var slugs = [];
      if(mode === 'related'){ slugs = (RELATED[key] || []).slice(); }
      else if(mode === 'position-projects'){ slugs = (POS_PROJECTS[key] || []).slice(); }
      if(!slugs.length) continue;
      var html = '';
      for(var j=0;j<slugs.length;j++){ html += card(slugs[j]); }
      n.innerHTML = '<div class="proj-grid">' + html + '</div>';
    }
  }
  function initResumeSwitch(){
    var sel = document.getElementById('resumeSwitch'); if(!sel) return;
    // path-aware base: pages under /positions/ need '../' for resumes and '' for position pages;
    // root pages need '' for resumes and 'positions/' for position pages.
    var isPos = location.pathname.split('/').indexOf('positions') > -1;
    var RP = isPos ? '../' : '';
    var PP = isPos ? '' : 'positions/';
    function apply(v){
      var r = RESUMES[v]; if(!r) return;
      var links = document.querySelectorAll('.js-resume');
      for(var i=0;i<links.length;i++){
        var a = links[i];
        var isDocx = a.getAttribute('data-fmt') === 'docx';
        a.href = RP + (isDocx ? r.docx : r.pdf);
        if(isDocx){ a.setAttribute('download',''); } else { a.removeAttribute('download'); }
      }
      var pages = document.querySelectorAll('.js-resume-page');
      for(var j=0;j<pages.length;j++){ pages[j].href = PP + r.page; pages[j].textContent = '📂 ' + r.label + '岗位作品集'; }
    }
    sel.addEventListener('change', function(){ apply(sel.value); });
    apply(sel.value);
  }
  /* ---------- project relationship network graph (injected) ---------- */
  var NET_W = 540, NET_H = 320, NET_CX = 270, NET_CY = 160, NET_R = 116;
  function svgEl(tag, attrs){
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for(var k in attrs){ e.setAttribute(k, attrs[k]); }
    return e;
  }
  function renderNetwork(){
    var nodes = document.querySelectorAll('[data-network]');
    var isPosN = location.pathname.split('/').indexOf('positions') > -1;
    var NPP = isPosN ? '../projects/' : 'projects/';
    for(var i=0;i<nodes.length;i++){
      var slug = nodes[i].getAttribute('data-network');
      var me = PROJECTS[slug]; if(!me) continue;
      var rel = (RELATED[slug] || []).slice();
      var svg = svgEl('svg', {viewBox:'0 0 '+NET_W+' '+NET_H, 'class':'net-svg', role:'img', 'aria-label':me.name+' 的项目关系网络'});
      // edges
      for(var j=0;j<rel.length;j++){
        var ang = (-90 + j*(360/rel.length)) * Math.PI/180;
        var x = NET_CX + NET_R*Math.cos(ang), y = NET_CY + NET_R*Math.sin(ang);
        svg.appendChild(svgEl('line', {x1:NET_CX, y1:NET_CY, x2:x, y2:y, 'class':'net-edge'}));
      }
      // satellites
      for(var k=0;k<rel.length;k++){
        var s = rel[k]; var p = PROJECTS[s]; if(!p) continue;
        var a2 = (-90 + k*(360/rel.length)) * Math.PI/180;
        var sx = NET_CX + NET_R*Math.cos(a2), sy = NET_CY + NET_R*Math.sin(a2);
        var g = svgEl('a', {href:NPP+s+'.html', 'class':'net-node'});
        g.appendChild(svgEl('circle', {cx:sx, cy:sy, r:30, fill:p.rc, 'fill-opacity':0.16, stroke:p.rc, 'stroke-width':1.5}));
        var t1 = svgEl('text', {x:sx, y:sy-2, 'text-anchor':'middle', 'class':'net-mono'}); t1.textContent = MONO[s] || s.slice(0,2).toUpperCase();
        var t2 = svgEl('text', {x:sx, y:sy+13, 'text-anchor':'middle', 'class':'net-name'}); t2.textContent = p.tag;
        g.appendChild(t1); g.appendChild(t2);
        var title = svgEl('title', {}); title.textContent = p.name; g.appendChild(title);
        svg.appendChild(g);
      }
      // center (current)
      var c = svgEl('g', {class:'net-center'});
      c.appendChild(svgEl('circle', {cx:NET_CX, cy:NET_CY, r:40, fill:me.rc, 'fill-opacity':0.22, stroke:me.rc, 'stroke-width':2}));
      var ct1 = svgEl('text', {x:NET_CX, y:NET_CY-4, 'text-anchor':'middle', 'class':'net-mono net-mono-c'}); ct1.textContent = MONO[slug] || slug.slice(0,2).toUpperCase();
      var ct2 = svgEl('text', {x:NET_CX, y:NET_CY+14, 'text-anchor':'middle', 'class':'net-name net-name-c'}); ct2.textContent = me.tag;
      c.appendChild(ct1); c.appendChild(ct2);
      var ctitle = svgEl('title', {}); ctitle.textContent = me.name + '（当前）'; c.appendChild(ctitle);
      svg.appendChild(c);
      nodes[i].innerHTML = '';
      nodes[i].appendChild(svg);
    }
  }
  /* ---------- skills-domain radar (injected) ---------- */
  var DOMAINS = {
    'pyconometrics':'计量经济','quantlab':'量化金融','dsgepy':'宏观建模','macrodatahub':'宏观建模',
    'policysim':'宏观建模','city-compare':'城市实证','express-consumption':'城市实证',
    'causal-inference-ml':'因果推断','mcp-financial-data':'量化金融','econ-dashboard':'数据看板'
  };
  var RADAR_AXES = ['计量经济','量化金融','宏观建模','城市实证','因果推断','数据看板'];
  function renderRadar(){
    var nodes = document.querySelectorAll('[data-radar]');
    if(!nodes.length) return;
    var counts = {};
    for(var s in DOMAINS){ var d = DOMAINS[s]; counts[d] = (counts[d]||0) + 1; }
    var max = 1; for(var a=0;a<RADAR_AXES.length;a++){ max = Math.max(max, counts[RADAR_AXES[a]]||0); }
    var W=380, H=320, cx=W/2, cy=H/2+8, R=110, n=RADAR_AXES.length;
    function pt(idx, val){
      var ang = (-90 + idx*(360/n)) * Math.PI/180;
      var r = R * (val/max);
      return [cx + r*Math.cos(ang), cy + r*Math.sin(ang)];
    }
    var svg = svgEl('svg', {viewBox:'0 0 '+W+' '+H, 'class':'radar-svg', role:'img', 'aria-label':'能力域分布雷达图'});
    // grid rings
    for(var ring=1; ring<=max; ring++){
      var pts = [];
      for(var i2=0;i2<n;i2++){ var q = pt(i2, ring); pts.push(q[0].toFixed(1)+','+q[1].toFixed(1)); }
      svg.appendChild(svgEl('polygon', {points:pts.join(' '), 'class':'radar-grid'}));
    }
    // axes + labels
    for(var i3=0;i3<n;i3++){
      var edge = pt(i3, max);
      svg.appendChild(svgEl('line', {x1:cx, y1:cy, x2:edge[0], y2:edge[1], 'class':'radar-axis'}));
      var lp = pt(i3, max*1.18);
      var lab = svgEl('text', {x:lp[0], y:lp[1]+4, 'text-anchor':'middle', 'class':'radar-label'});
      lab.textContent = RADAR_AXES[i3];
      svg.appendChild(lab);
      var cnt = svgEl('text', {x:lp[0], y:lp[1]+18, 'text-anchor':'middle', 'class':'radar-count'});
      cnt.textContent = (counts[RADAR_AXES[i3]]||0) + ' 个';
      svg.appendChild(cnt);
    }
    // data polygon
    var dpts = [];
    for(var i4=0;i4<n;i4++){ var dp = pt(i4, counts[RADAR_AXES[i4]]||0); dpts.push(dp[0].toFixed(1)+','+dp[1].toFixed(1)); }
    svg.appendChild(svgEl('polygon', {points:dpts.join(' '), 'class':'radar-area'}));
    for(var i5=0;i5<n;i5++){ var dp2 = pt(i5, counts[RADAR_AXES[i5]]||0); svg.appendChild(svgEl('circle', {cx:dp2[0], cy:dp2[1], r:3.5, 'class':'radar-dot'})); }
    for(var h=0;h<nodes.length;h++){ nodes[h].innerHTML=''; nodes[h].appendChild(svg.cloneNode(true)); }
  }
  /* ---------- project mini-radar (injected) ---------- */
  // Capability emphasis (0-3) per project, estimated from tag/description. For relative viz only.
  var PROJ_RADAR = {
    'pyconometrics':       [3,1,1,0,2,1],
    'quantlab':            [1,3,0,0,1,1],
    'dsgepy':              [1,1,3,0,0,1],
    'macrodatahub':        [1,0,2,1,0,2],
    'policysim':           [2,0,3,1,2,1],
    'city-compare':        [1,0,1,3,0,2],
    'express-consumption': [2,0,0,2,1,1],
    'causal-inference-ml': [2,1,0,0,3,1],
    'mcp-financial-data':  [0,2,0,0,1,2],
    'econ-dashboard':      [1,1,1,2,0,3]
  };
  var MR_W=340, MR_H=260, MR_R=85, MR_MAX=3;
  function renderMiniRadar(){
    var nodes = document.querySelectorAll('[data-miniradar]');
    for(var i=0;i<nodes.length;i++){
      var slug = nodes[i].getAttribute('data-miniradar');
      var me = PROJECTS[slug]; var vals = PROJ_RADAR[slug]; if(!me || !vals) continue;
      var cx=MR_W/2, cy=MR_H/2+4, n=RADAR_AXES.length;
      function pt(idx,val){
        var ang = (-90 + idx*(360/n)) * Math.PI/180;
        var r = MR_R * (val/MR_MAX);
        return [cx + r*Math.cos(ang), cy + r*Math.sin(ang)];
      }
      var svg = svgEl('svg', {viewBox:'0 0 '+MR_W+' '+MR_H, 'class':'miniradar-svg', role:'img', 'aria-label':me.name+' 能力子雷达'});
      for(var ring=1; ring<=MR_MAX; ring++){
        var pts=[];
        for(var a=0;a<n;a++){ var q=pt(a,ring); pts.push(q[0].toFixed(1)+','+q[1].toFixed(1)); }
        svg.appendChild(svgEl('polygon', {points:pts.join(' '), 'class':'miniradar-grid'}));
      }
      for(var b=0;b<n;b++){
        var edge = pt(b, MR_MAX);
        svg.appendChild(svgEl('line', {x1:cx, y1:cy, x2:edge[0], y2:edge[1], 'class':'miniradar-axis'}));
        var lp = pt(b, MR_MAX*1.16);
        var lab = svgEl('text', {x:lp[0], y:lp[1]+3, 'text-anchor':'middle', 'class':'miniradar-label'});
        lab.textContent = RADAR_AXES[b]; svg.appendChild(lab);
      }
      var dpts=[];
      for(var c=0;c<n;c++){ var dp=pt(c, vals[c]); dpts.push(dp[0].toFixed(1)+','+dp[1].toFixed(1)); }
      var area = svgEl('polygon', {points:dpts.join(' '), 'class':'miniradar-area', style:'fill:'+me.rc});
      svg.appendChild(area);
      for(var d=0;d<n;d++){ var dp2=pt(d, vals[d]); svg.appendChild(svgEl('circle', {cx:dp2[0], cy:dp2[1], r:3, 'class':'miniradar-dot'})); }
      nodes[i].innerHTML = ''; nodes[i].appendChild(svg);
    }
  }
  /* ---------- project timeline by month (injected) ---------- */
  function renderTimeline(){
    var nodes = document.querySelectorAll('[data-timeline]'); if(!nodes.length) return;
    var isPos = location.pathname.split('/').indexOf('positions') > -1;
    var PP = isPos ? '../projects/' : 'projects/';
    var groups = {};
    for(var s in PROJECTS){ var p=PROJECTS[s]; groups[p.upd] = (groups[p.upd] || []).concat(s); }
    var months = Object.keys(groups).sort();
    var html = '<div class="tl-wrap">';
    for(var i=0;i<months.length;i++){
      var m = months[i]; var slugs = groups[m];
      html += '<div class="tl-node"><div class="tl-month">'+m+'</div><div class="tl-chips">';
      for(var j=0;j<slugs.length;j++){
        var p = PROJECTS[slugs[j]];
        html += '<a class="tl-chip" href="'+PP+slugs[j]+'.html" style="--rc:'+p.rc+'"><span class="tl-mono">'+(MONO[slugs[j]] || slugs[j].slice(0,2).toUpperCase())+'</span><span>'+p.name+'</span></a>';
      }
      html += '</div></div>';
      if(i < months.length-1){ html += '<div class="tl-connector"></div>'; }
    }
    html += '</div>';
    for(var k=0;k<nodes.length;k++){ nodes[k].innerHTML = html; }
  }
  /* ---------- GitHub real data: contribution timeline + file tree (injected) ---------- */
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmtSize(b){ if(b>=1048576) return (b/1048576).toFixed(1)+' MB'; if(b>=1024) return (b/1024).toFixed(1)+' KB'; return b+' B'; }
  function renderGHTree(nodes){
    if(!nodes || !nodes.length) return '<div class="gh-empty">空仓库</div>';
    var h = '';
    for(var i=0;i<nodes.length;i++){
      var n = nodes[i];
      if(n.type === 'tree'){
        var kids = (n.children && n.children.length) || 0;
        h += '<div class="gh-folder"><span class="gh-ic">📁</span><span class="gh-name">'+escapeHtml(n.name)+'</span>'
          + (kids ? '<span class="gh-count">'+kids+' 项</span>' : '')
          + (kids ? '<div class="gh-children">'+renderGHTree(n.children)+'</div>' : '')
          + '</div>';
      } else {
        h += '<div class="gh-file"><span class="gh-ic">📄</span><span class="gh-name">'+escapeHtml(n.name)+'</span>'
          + (n.size ? '<span class="gh-count">'+fmtSize(n.size)+'</span>' : '')
          + '</div>';
      }
    }
    return h;
  }
  function renderGH(){
    var nodes = document.querySelectorAll('[data-gh]');
    if(!nodes.length) return;
    var GH = window.GH_DATA || {};
    for(var i=0;i<nodes.length;i++){
      var slug = nodes[i].getAttribute('data-gh');
      var rec = GH[slug];
      if(!rec || rec.error){ nodes[i].innerHTML = '<div class="gh-empty">暂无可展示的仓库数据</div>'; continue; }
      var total = rec.total_commits || (rec.commits ? rec.commits.length : 0);
      var html = '<div class="gh-block"><div class="gh-block-title">贡献时间线 <span class="gh-meta">真实 commit · 共 '+total+' 次提交</span></div><div class="gh-timeline">';
      var cs = rec.commits || [];
      if(!cs.length){ html += '<div class="gh-empty">暂无提交记录</div>'; }
      for(var c=0;c<cs.length;c++){
        var cm = cs[c];
        var url = cm.url || ('https://github.com/wzx11223344/'+slug+'/commit/'+cm.sha);
        html += '<a class="gh-commit" href="'+url+'" target="_blank" rel="noopener">'
          + '<span class="gh-dot"></span>'
          + '<span class="gh-date">'+cm.date+'</span>'
          + '<span class="gh-sha">'+cm.sha+'</span>'
          + '<span class="gh-msg">'+escapeHtml(cm.msg)+'</span>'
          + '<span class="gh-go">↗</span></a>';
      }
      html += '</div></div>';
      html += '<div class="gh-block"><div class="gh-block-title">文件结构树 <span class="gh-meta">'+rec.branch+' 分支 · 顶层 '+(rec.tree?rec.tree.length:0)+' 项</span></div><div class="gh-tree">';
      html += renderGHTree(rec.tree);
      html += '</div></div>';
      nodes[i].innerHTML = html;
    }
  }
  /* ---------- README / content image lightbox (injected) ---------- */
  var lbOv = null;
  function lbEnsure(){
    if(lbOv) return;
    lbOv = document.createElement('div'); lbOv.className = 'lb-overlay';
    lbOv.innerHTML = '<div class="lb-wrap"><img class="lb-img" alt=""><div class="lb-cap"></div><div class="lb-hint">点击任意处关闭 · Esc</div></div>';
    document.body.appendChild(lbOv);
    lbOv.addEventListener('click', lbClose);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') lbClose(); });
  }
  function lbOpen(src, cap){
    lbEnsure();
    lbOv.querySelector('.lb-img').src = src;
    lbOv.querySelector('.lb-cap').textContent = cap || '';
    lbOv.classList.add('open');
  }
  function lbClose(){ if(lbOv) lbOv.classList.remove('open'); }
  function initLightbox(){
    document.addEventListener('click', function(e){
      var img = e.target && e.target.closest ? e.target.closest('.readme img, .markdown-body img, .pd-net img') : null;
      if(!img) return;
      e.preventDefault();
      var src = img.getAttribute('data-canonical-src') || img.src;
      lbOpen(src, img.getAttribute('alt') || '');
    });
  }
  function boot(){ fillGalleries(); initResumeSwitch(); renderNetwork(); renderRadar(); renderMiniRadar(); renderTimeline(); renderGH(); initLightbox(); }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', boot); }
  else { boot(); }
})();

/* project detail: copy install command (injected) */
(function(){
  function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText){ return navigator.clipboard.writeText(text); }
    return new Promise(function(res, rej){
      try{ var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); res(); }
      catch(e){ rej(e); }
    });
  }
  function flash(btn){ var t=btn.textContent; btn.classList.add('copied'); btn.textContent='✓ 已复制'; setTimeout(function(){ btn.classList.remove('copied'); btn.textContent=t; }, 1400); }
  function initCopyInstall(){
    var btns = document.querySelectorAll('.pd-copy');
    for(var i=0;i<btns.length;i++){
      btns[i].addEventListener('click', function(){
        var box = this.parentElement;
        var code = box ? box.querySelector('code') : null;
        if(!code) return;
        var self = this;
        copyText(code.textContent).then(function(){ flash(self); }).catch(function(){ flash(self); });
      });
    }
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', initCopyInstall); }
  else { initCopyInstall(); }
})();

