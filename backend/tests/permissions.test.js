/**
 * Unit тесты для системы permissions
 */

const { describe, it, expect } = require('vitest');
const {
  hasPermission,
  hasHigherRank,
  ROLE_RANKS,
  ROLE_PERMISSIONS,
} = require('../src/permissions');

describe('Permissions System', () => {
  describe('ROLE_RANKS', () => {
    it('должен иметь правильные ранги ролей', () => {
      expect(ROLE_RANKS.Owner).toBe(100);
      expect(ROLE_RANKS.Admin).toBe(80);
      expect(ROLE_RANKS.Moderator).toBe(50);
      expect(ROLE_RANKS.Member).toBe(10);
    });
  });

  describe('hasPermission', () => {
    it('Owner должен иметь все права', () => {
      expect(hasPermission('Owner', 'server:delete')).toBe(true);
      expect(hasPermission('Owner', 'server:manage_channels')).toBe(true);
      expect(hasPermission('Owner', 'message:delete:any')).toBe(true);
    });

    it('Admin должен иметь права на управление каналами', () => {
      expect(hasPermission('Admin', 'server:manage_channels')).toBe(true);
      expect(hasPermission('Admin', 'server:manage_members')).toBe(true);
    });

    it('Admin не должен иметь права на удаление сервера', () => {
      expect(hasPermission('Admin', 'server:delete')).toBe(false);
    });

    it('Moderator должен иметь права на кик', () => {
      expect(hasPermission('Moderator', 'server:kick_members')).toBe(true);
    });

    it('Moderator не должен иметь права на управление каналами', () => {
      expect(hasPermission('Moderator', 'server:manage_channels')).toBe(false);
    });

    it('Member должен иметь права на чтение и отправку сообщений', () => {
      expect(hasPermission('Member', 'channel:read')).toBe(true);
      expect(hasPermission('Member', 'message:send')).toBe(true);
    });

    it('Member не должен иметь права на удаление чужих сообщений', () => {
      expect(hasPermission('Member', 'message:delete:any')).toBe(false);
    });
  });

  describe('hasHigherRank', () => {
    it('должен возвращать true если ранг выше', () => {
      expect(hasHigherRank(100, 80)).toBe(true);
      expect(hasHigherRank(80, 50)).toBe(true);
      expect(hasHigherRank(50, 10)).toBe(true);
    });

    it('должен возвращать false если ранг ниже или равен', () => {
      expect(hasHigherRank(80, 100)).toBe(false);
      expect(hasHigherRank(50, 50)).toBe(false);
      expect(hasHigherRank(10, 10)).toBe(false);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('должен иметь права для всех ролей', () => {
      expect(ROLE_PERMISSIONS.Owner).toBeDefined();
      expect(ROLE_PERMISSIONS.Admin).toBeDefined();
      expect(ROLE_PERMISSIONS.Moderator).toBeDefined();
      expect(ROLE_PERMISSIONS.Member).toBeDefined();
    });

    it('Owner должен иметь больше всех прав', () => {
      expect(ROLE_PERMISSIONS.Owner.length).toBeGreaterThan(ROLE_PERMISSIONS.Admin.length);
      expect(ROLE_PERMISSIONS.Admin.length).toBeGreaterThan(ROLE_PERMISSIONS.Moderator.length);
      expect(ROLE_PERMISSIONS.Moderator.length).toBeGreaterThan(ROLE_PERMISSIONS.Member.length);
    });
  });
});
