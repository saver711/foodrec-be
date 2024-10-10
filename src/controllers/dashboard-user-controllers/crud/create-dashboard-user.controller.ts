import { ErrorCode } from "@models/api/error-code.enum"
import DashboardUser from "@models/dashboard-user.model"
import { UserType } from "@models/user-type.enum"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens"
import bcrypt from "bcryptjs"
import { NextFunction, Request, Response } from "express"

// Create Auditor user
export const createDashboardUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body

  try {
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
      role: "AUDITOR"
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
    res.status(201).json({
      message: "User created successfully",
      data: { ...userWithoutPassword, accessToken, refreshToken }
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}
