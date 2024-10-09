// src/index.ts
import dotenv from "dotenv"
import express from "express"
import connectDB from "@utils/db"
// ROUTES
import bloggerRoutes from "@routes/blogger.routes"
import mealRoutes from "@routes/meal.routes"
import restaurantRoutes from "@routes/restaurant.routes"
import dashboardUserRoutes from "@routes/dashboard-user-management.routes"
import appUserRoutes from "@routes/app-user-management.routes"
import refreshTokenRoutes from "@routes/refresh-token.route"
dotenv.config()

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

// Database connection
connectDB()

// Start the server
const PORT = process.env.PORT || "5000"
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
