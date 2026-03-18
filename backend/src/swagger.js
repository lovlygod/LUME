/**
 * OpenAPI (Swagger) конфигурация для LUME API
 * RapiDoc - современный красивый UI с темной темой
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// ==================== OpenAPI Configuration ====================

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LUME API',
      version: '1.0.0',
      description: `
# LUME API Documentation

Полнофункциональная социальная сеть с мессенджером.

## 🔐 Аутентификация
- Токены хранятся в **httpOnly cookies**
- Access token: 24 часа
- Refresh token: 30 дней
- CSRF токен требуется для всех мутаций (POST/PUT/DELETE/PATCH)

## 📡 Формат ответов
\`\`\`json
{
  "data": { ... },
  "meta": { ... }
}
\`\`\`

или при ошибке:
\`\`\`json
{
  "error": {
    "message": "...",
    "code": "...",
    "statusCode": 400,
    "details": { ... }
  }
}
\`\`\`

## 🛡️ Безопасность
- CSRF Token в заголовке \`X-CSRF-Token\`
- Rate limiting: 5 попыток/15 мин для login
- WebSocket: 30 сообщений/минуту
      `,
      contact: {
        name: 'LUME Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.LUME.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Access token в httpOnly cookie',
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF токен для мутаций',
        },
      },
      schemas: {
        // ==================== User Schemas ====================
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'John Doe' },
            username: { type: 'string', example: 'johndoe' },
            bio: { type: 'string', nullable: true, example: 'Hello!' },
            avatar: { type: 'string', nullable: true, format: 'uri' },
            banner: { type: 'string', nullable: true, format: 'uri' },
            verified: { type: 'boolean', example: false },
            joinDate: { type: 'string', format: 'date-time' },
            followersCount: { type: 'integer', example: 42 },
          },
        },
        UserAuth: {
          allOf: [
            { $ref: '#/components/schemas/User' },
            {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                city: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                pinnedPostId: { type: 'string', nullable: true },
              },
            },
          ],
        },
        
        // ==================== Post Schemas ====================
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            userId: { type: 'string', example: '1' },
            text: { type: 'string', nullable: true, example: 'Hello world!' },
            imageUrl: { type: 'string', nullable: true, format: 'uri' },
            timestamp: { type: 'string', format: 'date-time' },
            replies: { type: 'integer', example: 5 },
            reposts: { type: 'integer', example: 2 },
            resonance: { type: 'integer', example: 10 },
            author: { $ref: '#/components/schemas/UserPreview' },
          },
        },
        UserPreview: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            verified: { type: 'boolean' },
          },
        },
        
        // ==================== Message Schemas ====================
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            senderId: { type: 'string', example: '1' },
            text: { type: 'string', example: 'Hello!' },
            timestamp: { type: 'string', format: 'date-time' },
            own: { type: 'boolean' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' },
            },
            deletedForMe: { type: 'boolean' },
            deletedForAll: { type: 'boolean' },
          },
        },
        Chat: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            userId: { type: 'string', example: '2' },
            name: { type: 'string', nullable: true },
            username: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            verified: { type: 'boolean' },
            lastMessage: { type: 'string', nullable: true },
            timestamp: { type: 'string', format: 'date-time' },
            unread: { type: 'integer', example: 3 },
          },
        },
        Attachment: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['image', 'file'] },
            url: { type: 'string', format: 'uri' },
            mime: { type: 'string', example: 'image/png' },
            size: { type: 'integer', example: 102400 },
            width: { type: 'integer', nullable: true },
            height: { type: 'integer', nullable: true },
          },
        },
        
        // ==================== Server Schemas ====================
        Server: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', nullable: true, example: 'gaminghub' },
            name: { type: 'string', example: 'Gaming Hub' },
            description: { type: 'string', nullable: true },
            iconUrl: { type: 'string', nullable: true, format: 'uri' },
            type: { type: 'string', enum: ['public', 'private'] },
            ownerId: { type: 'integer' },
            isMember: { type: 'boolean' },
            role: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                name: { type: 'string', enum: ['Owner', 'Admin', 'Moderator', 'Member'] },
                rank: { type: 'integer', example: 80 },
              },
            },
            channels: {
              type: 'array',
              items: { $ref: '#/components/schemas/Channel' },
            },
            joinRequest: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'integer' },
                status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
              },
            },
          },
        },
        Channel: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string', example: 'general' },
            type: { type: 'string', enum: ['text', 'voice'] },
            position: { type: 'integer', example: 0 },
          },
        },
        ServerMember: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            verified: { type: 'boolean' },
            role: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                rank: { type: 'integer' },
              },
            },
          },
        },
        
        // ==================== Error Schemas ====================
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                statusCode: { type: 'integer', example: 400 },
                details: { type: 'object', nullable: true },
              },
            },
          },
        },
        
        // ==================== Auth Schemas ====================
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'username'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            name: { type: 'string', example: 'John Doe' },
            username: { 
              type: 'string', 
              minLength: 5, 
              pattern: '^[a-zA-Z0-9]+$',
              example: 'johndoe',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful' },
            token: { type: 'string', description: 'Access token' },
            user: { $ref: '#/components/schemas/UserAuth' },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
        csrfToken: [],
      },
    ],
    tags: [
      { name: 'Auth', description: '🔐 Аутентификация и регистрация' },
      { name: 'Users', description: '👤 Пользователи и профили' },
      { name: 'Posts', description: '📝 Публикации и комментарии' },
      { name: 'Messages', description: '💬 Личные сообщения' },
      { name: 'Servers', description: '🏰 Серверы (Communities)' },
      { name: 'Verification', description: '✅ Верификация пользователей' },
      { name: 'Admin', description: '👑 Админ-панель' },
    ],
  },
  apis: [
    './src/api.js',
    './src/auth.js',
    './src/profile.js',
    './src/servers.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

// ==================== RapiDoc HTML ====================

const rapidocHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LUME API Documentation</title>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background-color: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    
    rapidoc {
      --bg-color: #09090b;
      --primary-color: #8b5cf6;
      --text-color: #fafafa;
      --text-color-subtle: #a1a1aa;
      --border-color: #27272a;
      --hover-color: #18181b;
      --code-bg-color: #09090b;
      --code-text-color: #fafafa;
      --header-color: #fafafa;
      --tag-bg-color: #18181b;
      --tag-text-color: #fafafa;
      --method-get-bg: #3b82f6;
      --method-post-bg: #22c55e;
      --method-put-bg: #f59e0b;
      --method-delete-bg: #ef4444;
      --method-patch-bg: #8b5cf6;
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <rapidoc
    spec-url="/api-docs.json"
    theme="dark"
    bg-color="#09090b"
    text-color="#fafafa"
    header-color="#09090b"
    nav-hover-bg-color="#18181b"
    nav-bg-color="#09090b"
    primary-color="#8b5cf6"
    render-style="read"
    show-header="true"
    allow-authentication="true"
    allow-spec-url-load="false"
    allow-spec-file-load="false"
    sort-tags="true"
    sort-endpoints-by="path"
    default-schema-tab="example"
    schema-style="table"
    schema-expand-level="3"
    show-curl-before-try="true"
    font-size="small"
    regular-font="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    mono-font="'Fira Code', 'Consolas', 'Monaco', monospace"
  >
    <div slot="header" style="padding: 20px; background: linear-gradient(135deg, #09090b 0%, #18181b 100%); border-bottom: 1px solid #27272a;">
      <h1 style="color: #fafafa; font-size: 28px; margin-bottom: 8px;">
        🔌 LUME API
      </h1>
      <p style="color: #a1a1aa; font-size: 14px;">
        Полнофункциональная социальная сеть с мессенджером
      </p>
    </div>
    
    <div slot="footer" style="padding: 20px; text-align: center; color: #71717a; font-size: 12px; border-top: 1px solid #27272a;">
      LUME API Documentation • OpenAPI 3.0 • Made with ❤️
    </div>
  </rapidoc>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const rapidoc = document.querySelector('rapidoc');
      
      // Custom styling after RapiDoc loads
      rapidoc.addEventListener('loaded', function() {
        console.info('RapiDoc loaded successfully');
      });
    });
  </script>
</body>
</html>
`;

// ==================== Middleware ====================

/**
 * RapiDoc middleware с современной темной темой
 */
const rapidocHandler = (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(rapidocHtml);
};

module.exports = {
  swaggerSpec,
  rapidocHandler,
  rapidocHtml,
};


