/**
 * 用 Chrome DevTools Protocol 在真实浏览器里跑一遍交互，验证实验功能。
 * 依赖：Node 22 自带的全局 WebSocket。零第三方包。
 */
const { spawn } = require('child_process');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9333;
const BASE = 'http://127.0.0.1:5173';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.url.includes('127.0.0.1:5173'));
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* 还没起来 */ }
    await sleep(250);
  }
  throw new Error('拿不到调试目标');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () => resolve({
      send(method, params = {}) {
        const mid = ++id;
        ws.send(JSON.stringify({ id: mid, method, params }));
        return new Promise((res, rej) => {
          pending.set(mid, { res, rej });
          setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('timeout ' + method)); } }, 15000);
        });
      },
      close() { ws.close(); }
    });
    ws.onerror = e => reject(e);
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      }
    };
  });
}

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: `(async () => { ${expression} })()`,
    awaitPromise: true,
    returnByValue: true
  });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description));
  return r.result.value;
}

(async () => {
  const child = spawn(EDGE, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-proxy-server',
    '--user-data-dir=' + require('os').tmpdir() + '/edge-cdp',
    '--window-size=1280,900',
    `${BASE}/03-blog.html`
  ], { detached: false, stdio: 'ignore' });

  const results = [];
  const check = (name, pass, detail) => {
    results.push({ name, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  → ' + detail : ''}`);
  };

  try {
    const cdp = await connect(await getWsUrl());
    await cdp.send('Runtime.enable');
    await sleep(1200);

    /* ================= 03-blog：搜索 ================= */
    let r = await evalJs(cdp, `
      const input = document.querySelector('#app input[placeholder*="搜索关键词"]');
      const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      const before = document.querySelectorAll('.article').length;
      set(input, 'v-if');
      await new Promise(r => setTimeout(r, 60));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 120));
      return { before, after: document.querySelectorAll('.article').length };
    `);
    check('博客搜索：输入 v-if 回车后列表被过滤', r.before === 4 && r.after === 1, JSON.stringify(r));

    r = await evalJs(cdp, `
      const input = document.querySelector('#app input[placeholder*="搜索关键词"]');
      const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      set(input, 'zzzz不存在');
      await new Promise(r => setTimeout(r, 60));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 120));
      return {
        cards: document.querySelectorAll('.article').length,
        empty: !!document.querySelector('.empty')
      };
    `);
    check('博客搜索：无结果时显示空状态', r.cards === 0 && r.empty, JSON.stringify(r));

    /* ================= 03-blog：留言 ================= */
    r = await evalJs(cdp, `
      const name = document.querySelector('#m-name');
      const content = document.querySelector('#m-content');
      const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      const before = document.querySelectorAll('.msg-item').length;
      set(name, '测试同学');
      set(content, '这是自动化测试写入的留言');
      document.querySelector('.msg-form button[type="submit"]').click();
      await new Promise(r => setTimeout(r, 150));
      return {
        before,
        after: document.querySelectorAll('.msg-item').length,
        first: document.querySelector('.msg-item .msg-text').textContent.trim(),
        cleared: content.value
      };
    `);
    check('留言：提交后列表 +1、内容正确、输入框已清空',
      r.after === r.before + 1 && r.first === '这是自动化测试写入的留言' && r.cleared === '',
      JSON.stringify(r));

    r = await evalJs(cdp, `
      const before = document.querySelectorAll('.msg-item').length;
      document.querySelector('.msg-item .btn-danger').click();
      await new Promise(r => setTimeout(r, 150));
      return { before, after: document.querySelectorAll('.msg-item').length };
    `);
    check('留言：点击删除后列表 -1（filter 生效）', r.after === r.before - 1, JSON.stringify(r));

    r = await evalJs(cdp, `
      const btn = document.querySelector('.msg-form button[type="submit"]');
      btn.click();
      await new Promise(r => setTimeout(r, 150));
      return { alert: (document.querySelector('.alert-error') || {}).textContent || '' };
    `);
    check('留言：空内容被拦截并提示', /不能为空/.test(r.alert), JSON.stringify(r));

    /* ================= 02：v-if vs v-show ================= */
    await cdp.send('Page.navigate', { url: `${BASE}/02-directives.html` });
    await sleep(1300);

    r = await evalJs(cdp, `
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '切换显示');
      const before = {
        ifNode: !!document.querySelector('#box-if'),
        showNode: !!document.querySelector('#box-show')
      };
      btn.click();
      await new Promise(r => setTimeout(r, 200));
      return {
        before,
        after: {
          ifNode: !!document.querySelector('#box-if'),
          showNode: !!document.querySelector('#box-show'),
          showDisplay: document.querySelector('#box-show') ? document.querySelector('#box-show').style.display : 'none'
        }
      };
    `);
    check('v-if 会移除节点、v-show 只改 display',
      r.before.ifNode === true && r.before.showNode === true &&
      r.after.ifNode === false && r.after.showNode === true && r.after.showDisplay === 'none',
      JSON.stringify(r));

    /* ================= 05：Todolist 增/改/删 ================= */
    await cdp.send('Page.navigate', { url: `${BASE}/05-todolist-plus.html` });
    await sleep(1300);

    r = await evalJs(cdp, `
      localStorage.removeItem('lab5-todos');
      location.reload();
      return 'reload';
    `).catch(() => 'reload');

    await sleep(1500);

    r = await evalJs(cdp, `
      const input = document.querySelector('#app .todo-form .input');
      const set = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
      const before = document.querySelectorAll('.todo-list li').length;
      set(input, '自动化新增的任务');
      await new Promise(r => setTimeout(r, 60));
      document.querySelector('.todo-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      return {
        before,
        after: document.querySelectorAll('.todo-list li').length,
        firstText: document.querySelector('.todo-list li .text').textContent.trim(),
        cleared: input.value
      };
    `);
    check('Todolist：回车提交新增任务、输入框清空',
      r.after === r.before + 1 && r.firstText === '自动化新增的任务' && r.cleared === '',
      JSON.stringify(r));

    r = await evalJs(cdp, `
      // 点第一条的"编辑"，改文本，触发 blur 保存
      const li = document.querySelector('.todo-list li');
      const btn = [...li.querySelectorAll('button')].find(b => b.textContent.trim() === '编辑');
      btn.click();
      await new Promise(r => setTimeout(r, 150));
      const editInput = li.querySelector('.edit-input');
      const hasInput = !!editInput;
      editInput.value = '编辑后的任务名';
      editInput.dispatchEvent(new Event('input', { bubbles: true }));
      editInput.dispatchEvent(new Event('blur'));
      await new Promise(r => setTimeout(r, 200));
      return { hasInput, text: document.querySelector('.todo-list li .text').textContent.trim() };
    `);
    check('Todolist：编辑 → input 出现 → blur 保存生效',
      r.hasInput === true && r.text === '编辑后的任务名', JSON.stringify(r));

    r = await evalJs(cdp, `
      const li = document.querySelector('.todo-list li');
      const cb = li.querySelector('input[type="checkbox"]');
      const readDone = () => {
        const t = document.querySelector('.stat-group').textContent.replace(/\\s+/g, ' ');
        const m = t.match(/已完成 (\\d+)/);
        return m ? Number(m[1]) : -1;
      };
      const before = readDone();
      cb.click();
      await new Promise(r => setTimeout(r, 200));
      return {
        before,
        after: readDone(),
        doneClass: li.querySelector('.text').className,
        saved: JSON.parse(localStorage.getItem('lab5-todos') || '[]').length
      };
    `);
    check('Todolist：勾选完成态 + 统计 +1 + 写入 localStorage',
      /done/.test(r.doneClass) && r.after === r.before + 1 && r.saved > 0, JSON.stringify(r));

    r = await evalJs(cdp, `
      const doneTotal = (() => {
        const t = document.querySelector('.stat-group').textContent.replace(/\\s+/g, ' ');
        const m = t.match(/已完成 (\\d+)/);
        return m ? Number(m[1]) : -1;
      })();
      const seg = [...document.querySelectorAll('.segmented button')].find(b => b.textContent.includes('已完成'));
      seg.click();
      await new Promise(r => setTimeout(r, 200));
      return { doneTotal, visible: document.querySelectorAll('.todo-list li').length };
    `);
    check('Todolist：筛选"已完成"只显示完成项',
      r.visible === r.doneTotal && r.doneTotal > 0, JSON.stringify(r));

    cdp.close();
  } catch (e) {
    check('测试脚本执行', false, e.message);
  } finally {
    child.kill();
    const failed = results.filter(x => !x.pass);
    console.log('\n汇总：' + (results.length - failed.length) + '/' + results.length + ' 通过');
    process.exit(failed.length ? 1 : 0);
  }
})();
