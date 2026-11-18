// Мобильное меню
const burger = document.querySelector(".burger");
const nav = document.getElementById("nav");

function setMenu(open) {
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  nav.classList.toggle("is-open", open);
}

burger.addEventListener("click", () => {
  setMenu(burger.getAttribute("aria-expanded") !== "true");
});

nav.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

// Линия под шапкой после прокрутки
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// FAQ: плавное раскрытие поверх <details>, открыт только один пункт.
// Без JS аккордеон всё равно работает за счёт нативного <details>.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const items = document.querySelectorAll(".faq__item");

function animate(item, open) {
  const body = item.querySelector(".faq__body");
  if (reduceMotion) {
    item.open = open;
    return;
  }
  if (open) item.open = true;
  const start = open ? 0 : body.scrollHeight;
  const end = open ? body.scrollHeight : 0;
  const anim = body.animate(
    { height: [`${start}px`, `${end}px`] },
    { duration: 300, easing: "ease-out" }
  );
  anim.onfinish = () => {
    if (!open) item.open = false;
  };
}

items.forEach((item) => {
  item.querySelector("summary").addEventListener("click", (e) => {
    e.preventDefault();
    const willOpen = !item.open;
    if (willOpen) {
      items.forEach((other) => {
        if (other !== item && other.open) animate(other, false);
      });
    }
    animate(item, willOpen);
  });
});

// Текущий год в подвале
document.getElementById("year").textContent = new Date().getFullYear();
