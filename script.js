export default async function run(page, ui) {
  await page.waitForTimeout(3500); // preloader + typing
  await page.screenshot({ path: 'C:/Users/User/OneDrive/Documents/Python/loop-site/shot_hero.png' });
  // scroll through the page so reveals fire, then check bottom
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  // test the playground button
  await page.locator('#runBtn').click();
  await page.waitForTimeout(700);
  const out = await page.locator('#codeOutput').innerText();
  // test form validation
  await page.locator('#submitBtn').click();
  await page.waitForTimeout(300);
  const errors = await page.locator('.field.error').count();
  const reveals = await page.evaluate(() => ({
    total: document.querySelectorAll('.reveal').length,
    visible: document.querySelectorAll('.reveal.visible').length
  }));
  await page.screenshot({ path: 'C:/Users/User/OneDrive/Documents/Python/loop-site/shot_full.png', fullPage: true });
  return { playgroundOutput: out.slice(0, 200), validationErrorsShown: errors, reveals };
}
/* ============ LOOP — script.js ============ */
'use strict';

/* ---------- Preloader ---------- */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('preloader').classList.add('done'), 900);
});
// fallback if load hangs
setTimeout(() => document.getElementById('preloader').classList.add('done'), 2500);

/* ---------- Cursor glow ---------- */
const glow = document.getElementById('cursorGlow');
if (window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
}

/* ---------- Header ---------- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Mobile nav ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  nav.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  burger.classList.remove('open');
  nav.classList.remove('open');
  document.body.style.overflow = '';
}));

/* ---------- Smooth anchor scroll ---------- */
document.querySelectorAll('[data-scroll]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id.startsWith('#')) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- Hero terminal typing ---------- */
const lines = [
  '>>> student = Student("ты")\n',
  '>>> student.skills = []\n',
  '>>> for week in range(24):\n...     student.learn("python")\n',
  '>>> student.skills\n',
  "['основы', 'ооп', 'api', 'данные', 'проекты']\n",
  '>>> student.apply(job)\n',
  'OFFER RECEIVED ✓\n',
  '>>> # цикл прерван. твой ход.\n'
];
const termEl = document.getElementById('terminal');
let li = 0, ci = 0, buf = '';
function type() {
  if (li >= lines.length) { termEl.textContent = buf + '\n>>> _'; return; }
  buf += lines[li][ci];
  termEl.textContent = buf + '_';
  ci++;
  if (ci >= lines[li].length) { li++; ci = 0; setTimeout(type, 550); }
  else setTimeout(type, 24);
}
setTimeout(type, 1300);

/* ---------- Counters ---------- */
const counters = document.querySelectorAll('[data-count]');
const cio = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    cio.unobserve(en.target);
    const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1600;
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  });
}, { threshold: 0.6 });
counters.forEach(c => cio.observe(c));

/* ---------- Tilt cards ---------- */
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(900px) rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

/* ---------- Mini Python simulator (первые уроки) ---------- */
const runBtn = document.getElementById('runBtn');
const outEl = document.getElementById('codeOutput');
const codeEl = document.getElementById('codeInput');

function runMini(src) {
  const out = [];
  const env = {};
  const linesSrc = src.split('\n');
  let printCount = 0;
  const MAX = 200000;
  for (const raw of linesSrc) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    // f-string print
    let m = line.match(/^print\(f"(.*)"\)$/);
    if (m) {
      if (printCount++ > 50) { out.push('… вывод ограничен демо-режимом'); break; }
      out.push(m[1].replace(/\{([^}]+)\}/g, (_, v) => {
        v = v.trim();
        if (v in env) return env[v];
        if (/^[\d+\-*/(). ]+$/.test(v)) { try { return String(eval(v)); } catch { return '?'; } }
        return '?';
      }));
      continue;
    }
    // plain print
    m = line.match(/^print\((.*)\)$/);
    if (m) {
      if (printCount++ > 50) { out.push('… вывод ограничен демо-режимом'); break; }
      const v = m[1].trim();
      out.push(v in env ? String(env[v]) : v.replace(/^["']|["']$/g, ''));
      continue;
    }
    // assignment
    m = line.match(/^([a-zA-Zа-яА-Я_]\w*)\s*=\s*(.+)$/);
    if (m) {
      const name = m[1];
      let expr = m[2].trim();
      if (/^["'].*["']$/.test(expr)) { env[name] = expr.slice(1, -1); continue; }
      if (/^\d+$/.test(expr)) { env[name] = +expr; continue; }
      // simple while block is NOT supported per-line: detect and simulate
      out.push(`[демо] строка "${line}" выполняется на реальном уроке 🙂`);
      continue;
    }
    out.push(`[демо] "${line}" — полный интерпретатор на первом занятии`);
  }
  return out;
}

runBtn.addEventListener('click', () => {
  const src = codeEl.value;
  outEl.textContent = 'выполнение…';
  setTimeout(() => {
    let res;
    try { res = runMini(src); } catch { res = ['Ошибка: демо-режим понимает только print и переменные']; }
    // bonus: real arithmetic sum of while-loop pattern
    const m = src.match(/while\s+\w+\s*<=\s*(\d+)[\s\S]*?total\s*\+=\s*\w+/);
    if (m) {
      const n = +m[1];
      if (n > 0 && n < 100000) res.push('', `(реальный итог while-цикла: ${n * (n + 1) / 2})`);
    }
    outEl.textContent = res.join('\n');
  }, 400);
});

/* ---------- Plan select from pricing ---------- */
document.querySelectorAll('[data-plan]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = document.getElementById('f-plan');
    [...sel.options].forEach(o => { if (o.text === btn.dataset.plan) sel.value = o.value || o.text; });
    sel.value = btn.dataset.plan;
  });
});

/* ---------- Form validation ---------- */
const form = document.getElementById('form');
const formOk = document.getElementById('formOk');
const phoneRe = /^\+?[\d\s\-()]{10,18}$/;

function setError(input, msg) {
  const field = input.closest('.field');
  field.classList.toggle('error', !!msg);
  field.querySelector('.field__err').textContent = msg || '';
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = form.name, phone = form.phone, plan = form.plan, agree = document.getElementById('f-agree');
  let ok = true;
  if (name.value.trim().length < 2) { setError(name, 'Имя — минимум 2 символа'); ok = false; } else setError(name);
  if (!phoneRe.test(phone.value.trim())) { setError(phone, 'Введите телефон в формате +7 900 123-45-67'); ok = false; } else setError(phone);
  if (!plan.value) { setError(plan, 'Выберите тариф'); ok = false; } else setError(plan);
  if (!agree.checked) { agree.focus(); ok = false; }
  if (!ok) return;
  const btn = document.getElementById('submitBtn');
  btn.disabled = true; btn.textContent = 'Отправляем…';
  setTimeout(() => {
    btn.textContent = '✓ Готово';
    formOk.classList.add('show');
    form.reset();
    setTimeout(() => { btn.disabled = false; btn.textContent = 'Получить доступ'; }, 3000);
  }, 800);
});
['input', 'change'].forEach(ev => form.addEventListener(ev, e => {
  if (e.target.closest('.field')) setError(e.target);
}));

/* ---------- Parallax orbs ---------- */
const orbs = document.querySelectorAll('.hero__orb');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  orbs.forEach((o, i) => o.style.translate = `0 ${y * (i ? 0.08 : 0.14)}px`);
}, { passive: true });
