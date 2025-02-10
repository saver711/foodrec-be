import "./config/env.config"

// src/index.ts
import connectDB from "@utils/db.util"
import express from "express"
// ROUTES
import DashboardUser from "@models/dashboard-user.model"
import { DashboardUserRole } from "@models/user-role.enum"
import appUserRoutes from "@routes/app-user-management.routes"
import authRoutes from "@routes/auth.routes"
import bloggerRoutes from "@routes/blogger.routes"
import categoryRoutes from "@routes/category.routes"
import dashboardUserRoutes from "@routes/dashboard-user-management.routes"
import locationRoutes from "@routes/location.routes"
import recommendationRoutes from "@routes/recommendation.routes"
import restaurantRoutes from "@routes/restaurant.routes"
import bcrypt from "bcryptjs"
import { serve, setup } from "swagger-ui-express"
import swaggerDocument from "./docs/swagger.json"

const app = express()
app.use("/api-docs", serve, setup(swaggerDocument))

// Middleware
app.use(express.json())

// Routes

// dashboard-users routes
app.use("/api/dashboard-users", dashboardUserRoutes)

// app-users routes
app.use("/api/app-users", appUserRoutes)

// app-users routes
app.use("/api/auth", authRoutes)

// Blogger routes
app.use("/api/bloggers", bloggerRoutes)

// restaurant routes
app.use("/api/restaurants", restaurantRoutes)

// location routes
app.use("/api/locations", locationRoutes)

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

// const seedSuperAdmin = async () => {
//   const superAdmin = await DashboardUser.findOne({ email: "super@super.com" })
//   if (!superAdmin) {
//     const hashedPassword = await bcrypt.hash(
//       process.env.SUPER_ADMIN_PASSWORD!,
//       10
//     )
//     await DashboardUser.create({
//       name: "Super",
//       email: "super@super.com",
//       password: hashedPassword,
//       role: DashboardUserRole.SUPER_ADMIN
//     })
//     console.log("super@super.com user created.")
//   }
// }

// seedSuperAdmin()
