'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('C:/Users/dell/.workbuddy/binaries/node/workspace/node_modules/jsdom');

const root = path.resolve(__dirname, '..');
const pages = [
  'positions/index.html', 'positions/internet.html', 'positions/hr.html',
  'positions/bank.html', 'positions/finance.html', 'positions/state.html', 'positions/general.html'
];
const appJs = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function runPage(rel){
  return new Promise((resolve)=>{
    let html = fs.readFileSync(path.join(root, rel), 'utf8');
    // inline app.js so PD is defined in same document (jsdom won't fetch the relative src)
    html = html.replace('<script src="../assets/app.js"></script>', '<script>'+appJs+'</script>');

    const errors = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail ? e.detail.message : e.message)));

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      virtualConsole: vc,
      beforeParse(window){
        window.onerror = (msg)=>{ errors.push('window.onerror: ' + msg); };
        window.matchMedia = ()=>({matches:false, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}});
        window.requestAnimationFrame = ()=>0;            // noop → stop recursive draw loops
        window.cancelAnimationFrame = ()=>{};
        window.scrollTo = ()=>{};                         // jsdom has no scrollTo
        window.IntersectionObserver = class { constructor(cb){this.cb=cb;} observe(){} unobserve(){} disconnect(){} };
        const gradStub = ()=>({addColorStop(){}});
        window.HTMLCanvasElement.prototype.getContext = function(){
          return new Proxy({}, {
            get(t, prop){
              if(prop==='createLinearGradient' || prop==='createRadialGradient' || prop==='createPattern') return gradStub;
              if(prop==='canvas') return {width:0,height:0};
              if(prop==='measureText') return ()=>({width:0});
              return ()=>{};
            },
            set(){ return true; }
          });
        };
      }
    });

    setTimeout(()=>{
      // exercise interactive controls if present
      const w = dom.window, d = w.document;
      const click = sel => { const el = d.querySelector(sel); if(el && el.onclick) el.onclick(); };
      click('#funnel-btn'); click('#ab-run'); click('#ab-reset');
      click('#scan-btn'); click('#mc-run'); click('#smile-btn');
      const tog = d.querySelector('.nav-toggle'); if(tog) tog.dispatchEvent(new w.Event('click'));
      const st = d.getElementById('scroll-top'); if(st) st.dispatchEvent(new w.Event('click'));

      resolve({ rel, errors });
    }, 350);
  });
}

(async ()=>{
  let total = 0;
  for(const p of pages){
    const r = await runPage(p);
    if(r.errors.length){ total += r.errors.length; console.log('FAIL', p); r.errors.forEach(e=>console.log('   -', e)); }
    else console.log('OK  ', p);
  }
  console.log(total===0 ? '\nRUNTIME ALL GOOD ✅' : '\nRUNTIME ERRORS: '+total+' ❌');
  process.exit(total===0?0:1);
})();
