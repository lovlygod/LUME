# Модуль Онбординга LUME

[English](../docs/ONBOARDING_MODULE.md) | Русский | [中文](../docs-cn/ONBOARDING_MODULE.cn.md)

**Последнее обновление:** 2026-05-18  
**Статус:** ✅ Реализовано

---

## Обзор

Модуль онбординга проводит новых пользователей через 4-шаговый процесс настройки профиля, навыков, целей и предпочтений workspace. Это обеспечивает полноту профиля пользователя и подключение к нужным сообществам с первого дня.

---

## Архитектура

### Backend

**Файлы:**
- `backend/src/routes/onboardingRoutes.js` - API маршруты
- `backend/src/services/onboardingService.js` - Бизнес-логика
- `backend/src/validators/onboardingSchemas.js` - Схемы валидации

**База данных:**
- Поля профиля пользователя: `primary_role`, `skills`, `goals`, `onboarding_completed`

### Frontend

**Файлы:**
- `src/pages/onboarding/OnboardingPage.tsx` - Основной UI онбординга
- `src/services/api.ts` - Методы API клиента

---

## Процесс Онбординга

### Шаг 1: Настройка Профиля
**Цель:** Определить основную роль пользователя

**Опции:**
- Developer (Frontend, Backend, Fullstack)
- UI/UX Designer
- Telegram Bot Developer
- Game Developer
- Founder
- Student
- Open Source Contributor
- Other

**Сохраняемые данные:** `primary_role`

### Шаг 2: Выбор Навыков
**Цель:** Зафиксировать технические навыки

**Категории:**
- **Frontend:** React, Next.js, Vue, Tailwind, TypeScript
- **Backend:** Node.js, Python, FastAPI, Django, NestJS, Express
- **Боты:** Aiogram, Telethon, Telegraf, Telegram Mini Apps
- **База данных:** PostgreSQL, SQLite, MongoDB, Redis
- **Дизайн:** Figma, UI Design, UX Design, Branding
- **Другое:** Electron, C#, WPF, Unity, Godot, Rust, Go

**Сохраняемые данные:** `skills` (массив)

### Шаг 3: Определение Целей
**Цель:** Понять намерения пользователя

**Опции:**
- Найти команду
- Найти проект
- Показать свой проект
- Найти разработчика
- Общаться с инди-разработчиками
- Построить свою команду
- Создать open-source проект
- Найти фриланс/работу
- Просто просматривать проекты

**Сохраняемые данные:** `goals` (массив)

### Шаг 4: Настройка Workspace
**Цель:** Подключить пользователя к workspace

**Действия:**
- **Создать новый workspace:** Пользователь становится владельцем
- **Присоединиться к существующему workspace:** Через invite code
- **Пропустить:** Продолжить без workspace

**Сохраняемые данные:** Членство в workspace (если создан/присоединился)

---

## API Endpoints

Полная документация API доступна в [английской версии](../docs/ONBOARDING_MODULE.md#api-endpoints).

---

## Связанные Документы

- [Модуль Workspaces](./WORKSPACES_MODULE.ru.md)
- [Модуль Projects](./PROJECTS_MODULE.ru.md)
- [Инвентарь Функций](./FEATURES_INVENTORY.ru.md)
- [UI Онбординга](./PROJECT_UI/ONBOARDING_UI.ru.md)
- [README](../README.ru.md)