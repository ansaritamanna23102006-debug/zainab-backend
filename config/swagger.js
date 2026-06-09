const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zainab Clinic REST API',
      version: '1.0.0',
      description:
        'Production-ready REST API for Zainab Clinic. Handles appointments, contact messages, admin authentication, and dashboard statistics.',
      contact: {
        name:  'Zainab Clinic',
        email: 'zainabclinic@gmail.com',
      },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Local Development' },
      { url: 'https://api.zainabclinic.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:   'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
