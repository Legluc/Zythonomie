import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zythonomie API',
      version: '1.0.0',
      description: 'API de recommandation de bières artisanales',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { description: 'Payload de la réponse' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Ressource introuvable' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            firstname: { type: 'string' },
            mail: { type: 'string', format: 'email' },
            birthday: { type: 'string', format: 'date' },
            adress: { type: 'string' },
            icon: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
          },
        },
        Beer: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            alcool: { type: 'boolean' },
            percentage_alcool: { type: 'number' },
            EAN: { type: 'integer' },
            image: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Brewery: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            image: { type: 'string' },
            origin_date: { type: 'string', format: 'date-time' },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            id_parent_category: { type: 'integer', nullable: true },
          },
        },
        Pairing: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        Criterion: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
        Rating: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            id_user: { type: 'integer' },
            id_beer: { type: 'integer' },
            content: { type: 'string' },
            rate: { type: 'integer', minimum: 1, maximum: 5 },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Recommendation: {
          type: 'object',
          properties: {
            id_user: { type: 'integer' },
            id_beer: { type: 'integer' },
            score_compatibility: { type: 'number' },
          },
        },
        QuizzSession: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            id_user: { type: 'integer' },
            id_quizz: { type: 'integer' },
            status: { type: 'string', enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'] },
            started_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Quizz: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        QuizzQuestion: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            id_quizz: { type: 'integer' },
            id_criterion: { type: 'integer' },
            question: { type: 'string' },
          },
        },
        QuestionChoice: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            id_quizz_question: { type: 'integer' },
            choice: { type: 'string' },
            note_value: { type: 'integer' },
          },
        },
        Tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});

export { swaggerUi, swaggerSpec };
