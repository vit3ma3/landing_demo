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

// Форма заявки: в демо только проверка полей, данные никуда не уходят.
// Как отправлять заявки в Telegram без раскрытия токена — в README.md этой папки.
const form = document.getElementById("form");
const success = form.querySelector(".form__success");
const count = document.getElementById("f-count");
const agreeError = document.getElementById("agree-error");

function updateCount() {
  count.textContent = `${form.elements.desc.value.length} / 1000`;
}
form.elements.desc.addEventListener("input", updateCount);

const rules = {
  name: (v) => (v.trim().length >= 2 ? "" : "Укажите имя"),
  phone: (v) => (v.replace(/\D/g, "").length >= 10 ? "" : "Нужен номер из 10–11 цифр"),
  work: (v) => (v ? "" : "Выберите вид работ"),
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
  const agreed = form.elements.agree.checked;
  agreeError.textContent = agreed ? "" : "Нужно согласие на обработку данных";

  const firstBad = inputs[results.indexOf(false)] || (!agreed && form.elements.agree);
  if (firstBad) {
    firstBad.focus();
    return;
  }
  form.reset();
  updateCount();
  success.hidden = false;
});

form.addEventListener("input", (e) => {
  if (rules[e.target.name] && e.target.closest(".is-invalid")) check(e.target);
  if (e.target.name === "agree" && e.target.checked) agreeError.textContent = "";
});

// Калькулятор: площадь × цена за м² выбранного типа ремонта
const calc = document.getElementById("calc");
const areaInput = document.getElementById("area");
const areaRange = document.getElementById("area-range");
const sumEl = document.getElementById("calc-sum");
const daysEl = document.getElementById("calc-days");
const MIN_AREA = 15;
const MAX_AREA = 200;

const rub = (n) => new Intl.NumberFormat("ru-RU").format(Math.round(n / 1000) * 1000) + " ₽";

function plural(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function recalc() {
  const area = Math.min(MAX_AREA, Math.max(MIN_AREA, Number(areaInput.value) || MIN_AREA));
  const kind = calc.querySelector("input[name=kind]:checked");
  const days = Math.max(7, Math.ceil(area * Number(kind.dataset.days)));
  sumEl.textContent = rub(area * Number(kind.value));
  daysEl.textContent = `≈ ${days} ${plural(days, ["день", "дня", "дней"])} работ`;
  return { area, kind };
}

areaRange.addEventListener("input", () => {
  areaInput.value = areaRange.value;
  recalc();
});
areaInput.addEventListener("input", () => {
  areaRange.value = areaInput.value;
  recalc();
});
areaInput.addEventListener("change", () => {
  areaInput.value = recalc().area;
});
calc.addEventListener("change", recalc);
calc.addEventListener("submit", (e) => e.preventDefault());
recalc();

// Кнопка калькулятора переносит расчёт в форму заявки
document.getElementById("calc-order").addEventListener("click", () => {
  const { area, kind } = recalc();
  form.elements.work.value = kind.dataset.work;
  const label = kind.nextElementSibling.querySelector("b").textContent.toLowerCase();
  form.elements.desc.value = `Площадь ${area} м², ${label} ремонт. Расчёт на сайте: ${sumEl.textContent}`;
  updateCount();
});

// До / после: ползунок двигает границу
document.querySelectorAll(".ba__frame").forEach((frame) => {
  const range = frame.querySelector(".ba__range");
  range.addEventListener("input", () => frame.style.setProperty("--pos", `${range.value}%`));
});

// Текущий год в подвале
document.getElementById("year").textContent = new Date().getFullYear();
