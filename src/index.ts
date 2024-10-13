import "./config/env.config"

// src/index.ts
import connectDB from "@utils/db.util"
import express from "express"
// ROUTES
import appUserRoutes from "@routes/app-user-management.routes"
import bloggerRoutes from "@routes/blogger.routes"
import categoryRoutes from "@routes/category.routes"
import dashboardUserRoutes from "@routes/dashboard-user-management.routes"
import mealRoutes from "@routes/meal.routes"
import recommendationRoutes from "@routes/recommendation.routes"
import refreshTokenRoutes from "@routes/refresh-token.route"
import restaurantRoutes from "@routes/restaurant.routes"

const app = express()

// Middleware
app.use(express.json())

// Routes

// dashboard-users routes
app.use("/api/dashboard-users", dashboardUserRoutes)

// app-users routes
app.use("/api/app-users", appUserRoutes)

// app-users routes
app.use("/api/refresh-token", refreshTokenRoutes)

// Blogger routes
app.use("/api/bloggers", bloggerRoutes)

// meal routes
app.use("/api/meals", mealRoutes)

// restaurant routes
app.use("/api/restaurants", restaurantRoutes)

// recommendation routes
app.use("/api/recommendations", recommendationRoutes)

// Category routes
app.use("/api/categories", categoryRoutes)

// Database connection
connectDB()

// Start the server
const PORT = process.env.PORT || "5000"
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
