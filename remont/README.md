# Мастер Дом — лендинг ремонта квартир (демо)

Сайт вымышленной компании «Мастер Дом». Это тот же бренд, что у Telegram-бота приёма заявок
[@application_intake_demo_bot](https://t.me/application_intake_demo_bot): услуги, цены, FAQ и контакты
совпадают с `config.py` бота.

**Живая версия:** https://vit3ma3.github.io/landing_demo/remont/

## Что на странице

- Первый экран с калькулятором: площадь × тип ремонта. Показывает примерную стоимость и срок,
  а кнопка переносит расчёт в форму заявки.
- Услуги и цены, этапы работ, «до/после» с ползунком (заглушки на CSS), FAQ, контакты.
- Форма заявки с проверкой полей и кнопка «Написать в Telegram-бот».

> **В демо форма ничего никуда не отправляет.** Она проверяет поля и показывает «Заявка отправлена».
> Токена бота в коде сайта нет и быть не должно.

## Как в реальном проекте отправлять заявки в Telegram

### Почему нельзя вызывать Telegram API прямо из браузера

Для `sendMessage` нужен токен бота. Всё, что лежит в HTML и JS сайта, видит любой посетитель
через «Просмотр кода». С утёкшим токеном можно рассылать спам от имени бота, читать сообщения,
которые ему пишут, и сменить вебхук. Поэтому токен держат на сервере, а сайт обращается
к этому серверу.

Сервер для этого не нужен — хватит бесплатного **Cloudflare Worker**. Это маленькая функция в облаке.
Бесплатный тариф даёт 100 000 запросов в сутки, для заявок с лендинга этого с запасом.

```
Браузер ──POST /JSON──▶ Cloudflare Worker ──sendMessage──▶ Telegram ──▶ чат администратора
                         (BOT_TOKEN и ADMIN_CHAT_ID
                          хранятся в Secrets)
```

### 1. Создать Worker

Нужны аккаунт на [dash.cloudflare.com](https://dash.cloudflare.com) и Node.js.

```bash
npm create cloudflare@latest masterdom-lead -- --type=hello-world --lang=js
cd masterdom-lead
```

### 2. Код Worker'а — `src/index.js`

```js
// Принимает заявку с сайта и пересылает её администратору в Telegram.
// Токен и ID чата берутся из секретов Cloudflare и в браузер не попадают.

const MAX_LEN = { name: 100, phone: 30, work: 60, time: 40, desc: 1000 };

const escape = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

function cors(origin, env) {
  return {
    "Access-Control-Allow-Origin": origin === env.ALLOWED_ORIGIN ? origin : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

const json = (data, status, headers) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = cors(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { headers });
    if (request.method !== "POST") return json({ ok: false }, 405, headers);
    // Принимаем запросы только со своего сайта
    if (origin !== env.ALLOWED_ORIGIN) return json({ ok: false }, 403, headers);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: "bad_json" }, 400, headers);
    }

    // Honeypot: скрытое поле, которое заполняют только боты
    if (data.website) return json({ ok: true }, 200, headers);

    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();
    if (name.length < 2 || phone.replace(/\D/g, "").length < 10) {
      return json({ ok: false, error: "validation" }, 422, headers);
    }
    for (const [key, max] of Object.entries(MAX_LEN)) {
      if (String(data[key] || "").length > max) {
        return json({ ok: false, error: "too_long" }, 422, headers);
      }
    }

    const text = [
      "<b>Новая заявка с сайта</b>",
      `👤 ${escape(name)}`,
      `📞 ${escape(phone)}`,
      data.work && `🔧 ${escape(data.work)}`,
      data.time && `🕘 ${escape(data.time)}`,
      data.desc && `📝 ${escape(data.desc)}`,
    ].filter(Boolean).join("\n");

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.ADMIN_CHAT_ID, text, parse_mode: "HTML" }),
    });

    return json({ ok: tg.ok }, tg.ok ? 200 : 502, headers);
  },
};
```

### 3. Настройки и секреты

В `wrangler.toml` (или `wrangler.jsonc`) указываем адрес сайта. Это не секрет:

```toml
[vars]
ALLOWED_ORIGIN = "https://vit3ma3.github.io"
```

Токен и ID чата кладём в зашифрованные секреты. В репозиторий они не попадают:

```bash
npx wrangler secret put BOT_TOKEN       # токен от @BotFather
npx wrangler secret put ADMIN_CHAT_ID   # ID чата администратора
npx wrangler deploy
```

После деплоя Wrangler напечатает адрес вида `https://masterdom-lead.<аккаунт>.workers.dev`.

### 4. Подключить форму на сайте

В `index.html` добавить в форму скрытое поле-ловушку для ботов:

```html
<input type="text" name="website" tabindex="-1" autocomplete="off" hidden>
```

В `js/main.js` после успешной проверки полей вместо `form.reset()` отправить данные на Worker:

```js
const WORKER_URL = "https://masterdom-lead.<аккаунт>.workers.dev";

const payload = Object.fromEntries(new FormData(form));
delete payload.agree;

try {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.status);
  form.reset();
  success.hidden = false;
} catch {
  alert("Не удалось отправить заявку. Позвоните нам или напишите в Telegram-бот.");
}
```

Обработчик `submit` при этом надо сделать асинхронным: `form.addEventListener("submit", async (e) => { … })`.

В адресе Worker'а нет ничего секретного, его можно держать в коде сайта.

### Дополнительная защита от спама

- **Cloudflare Turnstile** — бесплатная невидимая капча. Виджет ставится на форму, а Worker проверяет токен
  через `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
- **Rate limiting** — правило в панели Cloudflare (Security → WAF → Rate limiting), например
  не больше 5 заявок в минуту с одного IP.

## Локальный просмотр

Откройте `index.html` в браузере — ничего устанавливать не нужно.
