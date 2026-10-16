# Hypego Portal — Next.js + Neon + Vercel

Полноценная основа игрового портала: аккаунты, защищённые сессии, роли/права, профиль с кастомизацией, каталог двух магазинов, заказы, внутренняя зарплата персонала, правила, тикеты, наказания, привилегии, аудит и PostgreSQL через Neon.

## Важно про внешние интеграции

Сайт не притворяется, что внешние системы подключены, когда секретов нет. Реальный приём карт (KZT/RUB/EUR) требует аккаунта у платёжного провайдера, договора/проверки бизнеса и его API-ключей + webhook. В архиве есть безопасный endpoint и блокировка пополнения до конфигурации, но конкретный provider adapter не включён, потому что он зависит от выбранного провайдера и страны регистрации. Пока `PAYMENT_PROVIDER=disabled`, реальные деньги не принимаются, баланс не меняется.

Фактическая выдача привилегий в Minecraft требует доверенного bridge-плагина/API или закрытого сервиса на сервере. В этом архиве покупки не выдают фиктивные привилегии: записи помечаются как ожидающие, пока bridge не настроен. Не выставляйте RCON напрямую в интернет.

## Локальный запуск (Termux/Linux/macOS)

Требуется Node.js 20.9+ (рекомендуется Node 22) и npm.

```bash
cp .env.example .env
# Откройте .env и задайте DATABASE_URL и AUTH_SECRET
npm install
set -a; . ./.env; set +a
npm run db:init
npm run admin:create
npm run dev
```

Откройте `http://localhost:3000`.

На Termux скачайте ZIP в `Download`, затем:

```bash
pkg update -y
pkg install nodejs git unzip -y
termux-setup-storage
cd ~/storage/downloads
unzip Hypego-Portal-Neon-Vercel.zip -d ~/hypego
cd ~/hypego
cp .env.example .env
nano .env
npm install
set -a; . ./.env; set +a
npm run db:init
npm run admin:create
npm run dev
```

## Neon

1. Создайте проект в Neon.
2. Скопируйте pooled connection string из Connect.
3. Заполните `DATABASE_URL` в `.env` локально.
4. Выполните `npm run db:init`.
5. Выполните `npm run admin:create` и задайте собственный пароль. Архив не содержит встроенного пароля администратора.

## GitHub → Vercel

```bash
git init
git add .
git commit -m "Initial Hypego portal"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPO.git
git push -u origin main
```

Создайте проект Vercel из GitHub-репозитория и добавьте в Project Settings → Environment Variables:

- `DATABASE_URL` — Neon pooled connection string
- `AUTH_SECRET` — случайная строка длиной не менее 32 символов
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token, если нужны аватары/баннеры
- `PAYMENT_PROVIDER` — оставьте `disabled`, пока интеграция с провайдером не настроена

После деплоя создайте схему командой `npm run db:init` локально с тем же `DATABASE_URL`. Не добавляйте `.env` в Git.

## Роли и ограничения

- Владелец проекта — системная роль сайта; не продаётся через магазин.
- Заместитель (ОПКА), Руководство, Куратор, Тех. админ, Тех. поддержка, Модератор, Стажёр.
- Куратор может редактировать правила, назначать Стажёра/Модератора/Тех. поддержку и вести внутреннюю зарплату. Куратор не может назначить роль владельца проекта.
- Зарплата персонала хранится отдельно от платёжного баланса; отрицательный баланс запрещён.
- Игровая привилегия «Владелец» в каталоге не равна системной роли «Владелец проекта».

## API highlights

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/me`, `PATCH /api/profile`, `POST /api/profile/upload`
- `GET /api/products?store=main|staff`, `POST /api/orders`, `GET /api/orders`
- `POST /api/billing/topup` — блокирует пополнение до настройки реального провайдера
- `GET /api/rules`, `PUT /api/admin/rules`
- `GET /api/admin/users`, `POST|DELETE /api/admin/roles`, `POST /api/admin/salary`
- `POST /api/products/seed`, `PATCH /api/admin/products`
- `POST /api/admin/punishments`, `GET /api/admin/audit`
- `GET|POST /api/tickets`, `GET|POST /api/wall`
- `GET|POST /api/admin/privileges`

## Товары и цены

Каталог включает позиции из технического задания, скидки для отмеченных товаров и отдельный магазин персонала. Для защиты от выдуманных цен начальные цены выставляются в `0`; владелец должен установить реальные цены и валюту перед публикацией. `POST /api/products/seed` доступен пользователю с разрешением `products.manage`. Изменение цены: `PATCH /api/admin/products` с `{ "id": "...", "price_cents": 19900, "discount_percent": 75, "stock": 1 }`.

## Ограничения этой сборки

- Это рабочий full-stack проект, но внешние сервисы нельзя активировать без ваших ключей и серверной инфраструктуры.
- Поддержка карт трёх валют реализуется через конкретного платёжного провайдера; в этой сборке безопасно отключена, чтобы не симулировать платежи.
- Minecraft delivery bridge не включён, поскольку нет данных/протокола вашего сервера. Не отправляйте команды Minecraft до интеграции с доверенным серверным сервисом.
- Интерфейс не хранит и не обрабатывает номера банковских карт или CVV.
