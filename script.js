/* ---------- theme ---------- */
const root = document.documentElement;
const stored = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

root.setAttribute('data-theme', stored || (prefersDark ? 'dark' : 'light'));

document.getElementById('themeToggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ---------- mobile menu ---------- */
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});

navLinks.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
});

/* ---------- sliding nav pill ---------- */
const links = [...navLinks.querySelectorAll('a')];
const pill = document.createElement('span');
pill.className = 'nav-pill';
navLinks.prepend(pill);

const isDesktopNav = () => window.matchMedia('(min-width: 761px)').matches;

let restingLink = null;   // section the pill returns to when the cursor leaves

function movePill(el, { animate = true } = {}) {
  if (!isDesktopNav()) return;

  if (!el) {
    pill.style.opacity = '0';
    return;
  }

  // jump without animating when we're just establishing a resting position
  if (!animate) pill.style.transition = 'none';

  pill.style.width = `${el.offsetWidth}px`;
  pill.style.transform = `translateX(${el.offsetLeft}px)`;
  pill.style.opacity = '1';

  if (!animate) {
    void pill.offsetWidth; // flush, so the next move animates from here
    pill.style.transition = '';
  }
}

links.forEach((a) => {
  a.addEventListener('mouseenter', () => movePill(a));
  a.addEventListener('focus', () => movePill(a));
});

navLinks.addEventListener('mouseleave', () => movePill(restingLink));
navLinks.addEventListener('focusout', (e) => {
  if (!navLinks.contains(e.relatedTarget)) movePill(restingLink);
});

/* ---------- scroll spy: which section the pill rests on ---------- */
const sections = links
  .map((a) => {
    const id = a.getAttribute('href');
    const el = id && id.startsWith('#') ? document.querySelector(id) : null;
    return el ? { link: a, el } : null;
  })
  .filter(Boolean);

function syncActive() {
  const line = window.scrollY + 160; // just below the floating nav
  let current = null;
  let best = -Infinity;

  // nav order != document order, so take the lowest section still above the
  // line rather than assuming `sections` is sorted
  for (const s of sections) {
    const top = s.el.offsetTop;
    if (top <= line && top > best) {
      best = top;
      current = s;
    }
  }

  // hero is above the first section — no resting pill up there
  if (window.scrollY < 80) current = null;

  const next = current ? current.link : null;
  if (next === restingLink) return;

  links.forEach((a) => a.classList.toggle('is-active', a === next));
  restingLink = next;

  if (!navLinks.matches(':hover')) movePill(restingLink);
}

/* ---------- nav shadow on scroll ---------- */
const nav = document.querySelector('.nav');

const onScroll = () => {
  nav.classList.toggle('is-stuck', window.scrollY > 12);
  syncActive();
};

onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// re-measure after fonts land and on resize (offsets shift when metrics change)
const remeasure = () => movePill(restingLink, { animate: false });
window.addEventListener('resize', remeasure);
if (document.fonts) document.fonts.ready.then(remeasure);

/* ---------- reveal on scroll ---------- */
const targets = document.querySelectorAll(
  '.card, .post, .skill, .exp, .h-hand, .section-sub, .about-media, .about-copy, .contact-inner'
);

targets.forEach((el) => el.classList.add('reveal'));

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      entry.target.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

targets.forEach((el) => io.observe(el));
