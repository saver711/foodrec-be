import jwt from "jsonwebtoken"
import RefreshToken from "../models/refresh-token.model"
import { DashboardUserRole, UserRole } from "../models/user-role.enum"
import { UserType } from "@models/user-type.enum"

// Generate access token
export const generateAccessToken = (
  userId: string,
  role: UserRole | DashboardUserRole,
  userType: UserType
) => {
  return jwt.sign(
    { userId, role, userType },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h" // Access token valid for 15 minutes
    }
  )
}

// Generate refresh token
export const generateRefreshToken = async (
  userId: string,
  role: UserRole | DashboardUserRole,
  userType: UserType
) => {
  const token = jwt.sign(
    { userId, userType, role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" // Refresh token valid for 7 days
    }
  )

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + 7) // Set refresh token expiry to 7 days

  // Save refresh token to database
  const refreshToken = new RefreshToken({
    userId,
    token,
    expiryDate,
    userType,
    role
  })

  await refreshToken.save()
  return token
}
