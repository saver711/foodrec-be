import { ErrorCode } from "@models/api/error-code.enum"
import DashboardUser from "@models/dashboard-user.model"
import RefreshToken from "@models/refresh-token.model"
import { UserType } from "@models/user-type.enum"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import bcrypt from "bcryptjs"
import { Request, Response } from "express"

// Login for dashboard users
export const loginDashboardUser = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const user = await DashboardUser.findOne({ email })
    if (!user) {
      return res.status(400).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
        errorCode: ErrorCode.INVALID_CREDENTIALS
      })
    }

    // Delete all previously created refresh tokens for this user
    await RefreshToken.deleteMany({
      userId: user._id,
      userType: UserType.DashboardUser
    })

    const accessToken = generateAccessToken(
      user._id as string,
      user.role,
      UserType.DashboardUser
    )
    const refreshToken = await generateRefreshToken(
      user._id as string,
      user.role,
      UserType.DashboardUser
    )

    // Remove the password field before returning user info
    const { password: _, ...userWithoutPassword } = user.toObject()

    // Set HTTP-only cookies for tokens
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1 * 60 * 1000

      // maxAge:
      //   (+process.env.ACCESS_TOKEN_EXPIRES_IN!.charAt(0) || 1) *
      //   24 *
      //   60 *
      //   60 *
      //   1000 // 1 day
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 1000 // 3 minutes in milliseconds
      // maxAge:
      //   (+process.env.REFRESH_TOKEN_EXPIRES_IN!.charAt(0) || 7) *
      //   24 *
      //   60 *
      //   60 *
      //   1000 // 7 days
    })

    res.json({
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      } // , accessToken, refreshToken Temp for Postman
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
