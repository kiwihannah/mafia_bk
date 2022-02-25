const swaggerUi = require('swagger-ui-express')
const swaggereJsdoc = require('swagger-jsdoc')

const options = {
  swaggerDefinition: {
    //json or yaml
    openapi: '3.0.0',
    info: {
      title: 'Express Service with Swagger!',
      version: '1.0.0',
      description: 'A REST API using swagger and express.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js', './swagger/*'],
}
const specs = swaggereJsdoc(options)
module.exports = { swaggerUi, specs }