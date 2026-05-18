# Модуль Workspaces LUME

[English](../docs/WORKSPACES_MODULE.md) | Русский | [中文](../docs-cn/WORKSPACES_MODULE.cn.md)

**Последнее обновление:** 2026-05-18  
**Статус:** ✅ Реализовано

---

## Обзор

Модуль Workspaces предоставляет совместные пространства, где команды могут организовывать проекты, управлять участниками и координировать работу. Workspaces служат контейнерами для проектов и обеспечивают ролевой контроль доступа.

---

## Типы Workspaces

**Публичные Workspaces:**
- Видны в разделе explore
- Любой может запросить присоединение
- Доступны для поиска

**Приватные Workspaces:**
- Только по приглашению
- Не видны в публичных списках
- Доступ только для участников

---

## Роли в Workspace

| Роль | Права |
|------|-------|
| **Owner** | Полный контроль, удаление workspace, передача владения, управление всеми участниками |
| **Admin** | Управление участниками, проектами и настройками (не может удалить owner) |
| **Lead** | Создание и управление проектами, назначение задач |
| **Developer** | Участие в проектах, создание задач |
| **Designer** | Участие в проектах, создание задач |
| **Member** | Просмотр проектов, участие в обсуждениях |
| **Guest** | Доступ только для чтения |

---

## API Endpoints

Полная документация API доступна в [английской версии](../docs/WORKSPACES_MODULE.md#api-endpoints).

Основные endpoints:
- `POST /workspaces` - Создать workspace
- `GET /workspaces/my` - Получить мои workspaces
- `GET /workspaces/public` - Получить публичные workspaces
- `GET /workspaces/:slug` - Получить workspace по slug
- `PATCH /workspaces/:id` - Обновить workspace
- `DELETE /workspaces/:id` - Удалить workspace
- `POST /workspaces/:id/members` - Добавить участника
- `GET /workspaces/:id/members` - Получить участников
- `POST /workspaces/:id/invites` - Сгенерировать invite code
- `POST /workspaces/join/:inviteCode` - Присоединиться через код

---

## Связанные Документы

- [Модуль Projects](./PROJECTS_MODULE.ru.md)
- [Модуль Tasks](./TASKS_MODULE.ru.md)
- [Модуль Onboarding](./ONBOARDING_MODULE.ru.md)
- [Инвентарь Функций](./FEATURES_INVENTORY.ru.md)
- [UI Workspaces](./PROJECT_UI/WORKSPACES_UI.ru.md)
- [README](../README.ru.md)