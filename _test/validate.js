'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pages = [
  'index.html',
  'positions/index.html', 'positions/internet.html', 'positions/hr.html',
  'positions/bank.html', 'positions/finance.html', 'positions/state.html', 'positions/general.html'
];

let fail = 0;

// 1) app.js (external) syntax
try {
  const code = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');
  new vm.Script(code, { filename: 'app.js' });
  console.log('OK  assets/app.js');
} catch (e) {
  fail++;
  console.log('FAIL assets/app.js ->', e.message);
}

// 2) inline scripts in each page
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
for (const p of pages) {
  const file = path.join(root, p);
  if (!fs.existsSync(file)) { console.log('MISS', p); continue; }
  const html = fs.readFileSync(file, 'utf8');
  let m, idx = 0, pageOk = true;
  while ((m = re.exec(html))) {
    idx++;
    const code = m[1];
    if (!code.trim()) continue;
    try {
      new vm.Script(code, { filename: p + '#inline' + idx });
    } catch (e) {
      pageOk = false; fail++;
      console.log('FAIL', p, 'inline#' + idx, '->', e.message);
    }
  }
  if (pageOk) console.log('OK ', p, '(inline scripts: ' + idx + ')');
}

// 3) sanity: required shared elements present in each positions page
const need = ['id="preloader"', 'class="nav-toggle"', 'class="nav-overlay"', 'id="scroll-top"', 'src="../assets/app.js"'];
for (const p of pages) {
  if (!p.startsWith('positions/')) continue;
  const html = fs.readFileSync(path.join(root, p), 'utf8');
  const missing = need.filter(s => html.indexOf(s) === -1);
  if (missing.length) { fail++; console.log('WARN', p, 'missing:', missing.join(', ')); }
  else console.log('OK  ' + p + ' shared-shell present');
}

console.log(fail === 0 ? '\nALL GOOD ✅' : '\nERRORS: ' + fail + ' ❌');
process.exit(fail === 0 ? 0 : 1);
