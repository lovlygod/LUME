# Модуль Projects LUME

[English](../docs/PROJECTS_MODULE.md) | Русский | [中文](../docs-cn/PROJECTS_MODULE.cn.md)

**Последнее обновление:** 2026-05-18  
**Статус:** ✅ Реализовано

---

> **Примечание:** Полный перевод этого документа на русский язык будет добавлен в ближайшее время.  
> Пожалуйста, обратитесь к [английской версии](../docs/PROJECTS_MODULE.md) для получения полной документации.

## Краткий Обзор

Модуль Projects позволяет командам создавать, управлять и демонстрировать свои проекты. Проекты могут быть связаны с workspaces, отслеживать задачи, управлять членами команды и отображать информацию о проекте, включая технологический стек, GitHub репозитории и demo URL.

### Основные Возможности

- Создание публичных/приватных проектов
- Статусы: Planning, Active, On Hold, Completed, Archived
- Управление командой с ролями
- Интеграция с задачами (Kanban)
- Ссылки на GitHub и demo
- Tech stack и теги
- Флаги "Looking for members" и "Open Source"

### API Endpoints

- `POST /projects` - Создать проект
- `GET /projects/my` - Получить мои проекты
- `GET /projects/public` - Получить публичные проекты
- `GET /projects/:slug` - Получить проект по slug
- `PATCH /projects/:id` - Обновить проект
- `DELETE /projects/:id` - Удалить проект

---

## Связанные Документы

- [Модуль Tasks](./TASKS_MODULE.ru.md)
- [Модуль Workspaces](./WORKSPACES_MODULE.ru.md)
- [Инвентарь Функций](./FEATURES_INVENTORY.ru.md)
- [README](../README.ru.md)