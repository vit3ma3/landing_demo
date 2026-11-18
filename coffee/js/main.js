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

// Тень под шапкой после прокрутки
const header = document.querySelector(".header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Вкладки меню. Без JS все категории просто идут списком друг под другом.
const tabs = [...document.querySelectorAll(".tab")];
const menu = document.querySelector(".menu");
menu.classList.add("has-tabs");

function selectTab(tab) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.setAttribute("aria-selected", String(active));
    t.tabIndex = active ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !active;
  });
}

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});
selectTab(tabs[0]);

// Время в Ярославле (московское), чтобы статус не зависел от часового пояса посетителя
function moscowNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday")) + 1;
  return { weekday, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Филиалы: «Открыто до …» / «Закрыто, откроется в …»
function updateBranches() {
  const { minutes } = moscowNow();
  document.querySelectorAll(".branch").forEach((b) => {
    const open = toMinutes(b.dataset.open);
    const close = toMinutes(b.dataset.close);
    const isOpen = minutes >= open && minutes < close;
    b.classList.toggle("is-open", isOpen);
    b.classList.toggle("is-closed", !isOpen);
    b.querySelector(".branch__status").textContent = isOpen
      ? `Открыто до ${b.dataset.close === "24:00" ? "полуночи" : b.dataset.close}`
      : `Закрыто, откроется в ${b.dataset.open}`;
  });
}

// Акция недели действует до конца воскресенья
function updatePromo() {
  const { weekday, minutes } = moscowNow();
  const left = (7 - weekday) * 1440 + (1440 - minutes);
  const days = Math.floor(left / 1440);
  const hours = Math.floor((left % 1440) / 60);
  document.getElementById("promo-left").textContent =
    days > 0 ? `${days} дн. ${hours} ч.` : `${hours} ч. ${left % 60} мин.`;
}

updateBranches();
updatePromo();
setInterval(() => {
  updateBranches();
  updatePromo();
}, 60000);

// Текущий год в подвале
document.getElementById("year").textContent = new Date().getFullYear();
