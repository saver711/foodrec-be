import { ErrorCode } from "@models/api/error-code.enum"
import DashboardUser from "@models/dashboard-user.model"
import { DASHBOARD_ROLES_SET, DashboardUserRole } from "@models/user-role.enum"
import { UserType } from "@models/user-type.enum"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import bcrypt from "bcryptjs"
import { NextFunction, Request, Response } from "express"

// Create Dashboard User
export const createDashboardUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password, role } = req.body

  try {
    // Check if role exists and is valid
    if (!role || !DASHBOARD_ROLES_SET.includes(role)) {
      return res.status(400).json({
        message: "Invalid or missing role",
        errorCode: ErrorCode.INVALID_ROLE
      })
    }

    // Disallow creating SUPER_ADMIN from API
    if (role === DashboardUserRole.SUPER_ADMIN) {
      return res.status(403).json({
        message: "Cannot create SUPER_ADMIN from API",
        errorCode: ErrorCode.CANT_CREATE_SUPER_ADMIN
      })
    }

    const existingUser = await DashboardUser.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        errorCode: ErrorCode.USER_ALREADY_EXISTS
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new DashboardUser({
      name,
      email,
      password: hashedPassword,
      role // Frontend sends the role
    })

    await newUser.save()

    const { password: _, ...userWithoutPassword } = newUser.toObject()

    const accessToken = generateAccessToken(
      userWithoutPassword._id as string,
      userWithoutPassword.role,
      UserType.DashboardUser
    )
    const refreshToken = await generateRefreshToken(
      userWithoutPassword._id as string,
      userWithoutPassword.role,
      UserType.DashboardUser
    )

    // Set HTTP-only cookies for tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge:
        (+process.env.ACCESS_TOKEN_EXPIRES_IN!.charAt(0) || 1) *
        24 *
        60 *
        60 *
        1000 // 1 day
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge:
        (+process.env.REFRESH_TOKEN_EXPIRES_IN!.charAt(0) || 7) *
        24 *
        60 *
        60 *
        1000 // 7 days
    })

    res.status(201).json({
      message: "User created successfully",
      data: { user: userWithoutPassword, accessToken, refreshToken } // , accessToken, refreshToken Temp for Postman
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
