// Мобильное меню
const burger = document.querySelector(".burger");
const nav = document.getElementById("nav");

function setMenu(open) {
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("is-locked", open);
}

burger.addEventListener("click", () => {
  setMenu(burger.getAttribute("aria-expanded") !== "true");
});

nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});

// Фон шапки после прокрутки
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Первый экран: кадры мозаики по очереди «проявляются», счётчик идёт следом
const frames = document.querySelectorAll(".frame");
const counter = document.querySelector(".hero__counter span");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lit = 0;

function lightFrame(i) {
  frames.forEach((f, n) => f.classList.toggle("is-lit", n === i));
  counter.textContent = String(i + 1).padStart(2, "0");
}
lightFrame(0);
if (!reduceMotion) {
  setInterval(() => {
    lit = (lit + 1) % frames.length;
    lightFrame(lit);
  }, 2600);
}

// Фильтр галереи
const shots = [...document.querySelectorAll(".shot")];
const filters = document.querySelectorAll(".filter");

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    const cat = btn.dataset.filter;
    shots.forEach((s) => s.classList.toggle("is-hidden", cat !== "all" && s.dataset.cat !== cat));
  });
});

// Лайтбокс: листает только видимые после фильтра кадры
const box = document.getElementById("lightbox");
const boxImg = box.querySelector(".lightbox__img");
const boxCap = box.querySelector(".lightbox__cap");
let current = 0;
let lastFocus = null;

const visibleShots = () => shots.filter((s) => !s.classList.contains("is-hidden"));

function show(i) {
  const list = visibleShots();
  current = (i + list.length) % list.length;
  const btn = list[current].querySelector(".shot__btn");
  boxImg.className = "lightbox__img " + [...btn.classList].find((c) => /^g\d+$/.test(c));
  boxCap.textContent = btn.querySelector(".shot__cap").textContent;
}

function openBox(shot) {
  lastFocus = document.activeElement;
  show(visibleShots().indexOf(shot));
  box.hidden = false;
  document.body.classList.add("is-locked");
  box.querySelector(".lightbox__close").focus();
}

function closeBox() {
  box.hidden = true;
  document.body.classList.remove("is-locked");
  if (lastFocus) lastFocus.focus();
}

shots.forEach((s) => s.querySelector(".shot__btn").addEventListener("click", () => openBox(s)));
box.querySelector(".lightbox__close").addEventListener("click", closeBox);
box.querySelector(".lightbox__nav--prev").addEventListener("click", () => show(current - 1));
box.querySelector(".lightbox__nav--next").addEventListener("click", () => show(current + 1));
box.addEventListener("click", (e) => {
  if (e.target === box) closeBox();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setMenu(false);
    if (!box.hidden) closeBox();
  }
  if (box.hidden) return;
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});

// Форма: в демо только проверка полей, данные никуда не уходят
const form = document.getElementById("form");
const success = form.querySelector(".form__success");

const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Как к вам обращаться?"),
  contact: (v) =>
    /^(\+?\d[\d\s()-]{9,}|@\w{4,})$/.test(v.trim()) ? "" : "Телефон или @username в Telegram",
  type: (v) => (v ? "" : "Выберите тип съёмки"),
  date: (v) => (!v || new Date(`${v}T00:00`) >= new Date(new Date().toDateString()) ? "" : "Дата уже прошла"),
};

function check(input) {
  const msg = rules[input.name](input.value);
  const field = input.closest(".field");
  field.classList.toggle("is-invalid", Boolean(msg));
  field.querySelector(".field__error").textContent = msg;
  return !msg;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputs = Object.keys(rules).map((name) => form.elements[name]);
  const results = inputs.map(check);
  if (results.includes(false)) {
    inputs[results.indexOf(false)].focus();
    return;
  }
  form.reset();
  success.hidden = false;
});

form.addEventListener("input", (e) => {
  if (rules[e.target.name] && e.target.closest(".is-invalid")) check(e.target);
});

// Текущий год в подвале
document.getElementById("year").textContent = new Date().getFullYear();
