import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import RefreshToken from "@models/refresh-token.model"
import { UserRole } from "@models/user-role.enum"
import { UserType } from "@models/user-type.enum"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import bcrypt from "bcryptjs"
import { Request, Response } from "express"

// User login
export const loginAppUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await AppUser.findOne({ email })
    if (!user)
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid)
      return res.status(401).json({
        message: "Invalid password",
        errorCode: ErrorCode.INVALID_PASSWORD
      })

    // Delete all previously created refresh tokens for this user
    await RefreshToken.deleteMany({ userId: user._id, userType: "AppUser" })

    const accessToken = generateAccessToken(
      user._id as string,
      UserRole.APP_USER,
      UserType.AppUser
    )

    const refreshToken = await generateRefreshToken(
      user._id as string,
      UserRole.APP_USER,
      UserType.AppUser
    )

    res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken }
    })
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error })
  }
}
