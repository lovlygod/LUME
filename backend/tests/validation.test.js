/**
 * Unit тесты для системы валидации
 */

const { describe, it, expect } = require('vitest');
const {
  registerSchema,
  loginSchema,
  createServerSchema,
  createChannelSchema,
  sendServerMessageSchema,
} = require('../src/validation');

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('должен принимать валидные данные регистрации', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        username: 'johndoe',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять регистрацию без email', () => {
      const invalidData = {
        password: 'password123',
        name: 'John Doe',
        username: 'johndoe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    });

    it('должен отклонять невалидный email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'John Doe',
        username: 'johndoe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять username короче 5 символов', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        username: 'abc',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять username с специальными символами', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        username: 'john@doe',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('должен принимать валидные данные для входа', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять вход без email', () => {
      const invalidData = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять вход без пароля', () => {
      const invalidData = {
        email: 'user@example.com',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createServerSchema', () => {
    it('должен принимать валидные данные сервера', () => {
      const validData = {
        name: 'Gaming Hub',
        username: 'gaminghub',
        type: 'public',
        description: 'Gaming community',
      };

      const result = createServerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять сервер без имени', () => {
      const invalidData = {
        username: 'gaminghub',
        type: 'public',
      };

      const result = createServerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен отклонять невалидный тип сервера', () => {
      const invalidData = {
        name: 'Gaming Hub',
        type: 'invalid',
      };

      const result = createServerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен принимать приватный сервер без username', () => {
      const validData = {
        name: 'Private Server',
        type: 'private',
      };

      const result = createServerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('createChannelSchema', () => {
    it('должен принимать валидное имя канала', () => {
      const validData = { name: 'general' };
      const result = createChannelSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('general');
    });

    it('должен преобразовывать имя канала в lowercase', () => {
      const validData = { name: 'General Chat' };
      const result = createChannelSchema.safeParse(validData);
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('general-chat');
    });

    it('должен отклонять имя канала короче 2 символов', () => {
      const invalidData = { name: 'a' };
      const result = createChannelSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('sendServerMessageSchema', () => {
    it('должен принимать сообщение с текстом', () => {
      const validData = { text: 'Hello!' };
      const result = sendServerMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен принимать сообщение с аттачами', () => {
      const validData = { attachmentIds: ['1', '2'] };
      const result = sendServerMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('должен отклонять пустое сообщение без аттачей', () => {
      const invalidData = { text: '' };
      const result = sendServerMessageSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('должен принимать сообщение с пробелом', () => {
      const validData = { text: ' ' };
      const result = sendServerMessageSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
