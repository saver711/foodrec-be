import bcrypt from "bcryptjs"
import { Request, Response } from "express"
import { ErrorCode } from "@models/api/error-code.enum"
import DashboardUser from "@models/dashboard-user.model"
import RefreshToken from "@models/refresh-token.model"
import { UserType } from "@models/user-type.eum"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens"

// Login for dashboard users
export const loginDashboardUser = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    const user = await DashboardUser.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
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
      userType: "DashboardUser"
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

    res.json({
      message: "Login successfully",
      data: { accessToken, role: user.role, refreshToken }
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
