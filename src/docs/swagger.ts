const options = {
  openapi: "OpenAPI 3",
  language: "en-US",
  disableLogs: false,
  autoHeaders: false,
  autoQuery: false,
  autoBody: false
}
const generateSwagger = require("swagger-autogen")()

// import Recommendation from "@models/recommendation.model"
// import mongooseToSwagger from "mongoose-to-swagger"

// const recommendationDefinition = mongooseToSwagger(Recommendation)

const swaggerDocument = {
  info: {
    version: "1.0.0",
    title: "Todo Apis",
    description: "API for Managing todo calls",
    contact: {
      name: "API Support",
      email: "tiwariankit496@gmail.com"
    }
  },
  host: "localhost:5000",
  basePath: "/",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  tags: [
    {
      name: "RECOMMENDATIONS",
      description: "RECOMMENDATIONS related apis"
    }
  ],
  securityDefinitions: {},
  definitions: {
    Recommendation: {
      _id: "string",
      quote: "string",
      mealName: "string",
      rating: 4.5,
      blogger: "string",
      restaurant: "string",
      mealDescription: "string",
      mealImages: ["string"],
      categories: ["string"],
      date: "2024-11-10T00:00:00Z",
      url: "string"
    },
    todoResponse: {
      code: 200,
      message: "Success"
    },
    "errorResponse.400": {
      code: 400,
      message:
        "The request was malformed or invalid. Please check the request parameters."
    },
    "errorResponse.401": {
      code: 401,
      message: "Authentication failed or user lacks proper authorization."
    },
    "errorResponse.403": {
      code: 403,
      message: "You do not have permission to access this resource."
    },
    "errorResponse.404": {
      code: "404",
      message: "The requested resource could not be found on the server."
    },
    "errorResponse.500": {
      code: 500,
      message:
        "An unexpected error occurred on the server. Please try again later."
    }
  }
}
const swaggerFile = "./swagger.json"
const apiRouteFile = ["../index.ts"]
generateSwagger(swaggerFile, apiRouteFile, swaggerDocument).then(() => {
  console.log(`Swagger at ${swaggerDocument.host}`)
})
