import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { UserType } from "@models/user-type.enum"
import { compare } from "@utils/compare.util" // Utility to compare hashed password
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import { Request, Response } from "express"
import { egyptianPhoneRegex } from "src/consts/egyptian-phone-regex"

// Login App User (Phone-based login with OTP)
export const appUserPhoneLogin = async (req: Request, res: Response) => {
  const { phone, password } = req.body

  try {
    if (!egyptianPhoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Must be like 01×12345678",
        errorCode: ErrorCode.INVALID_PHONE_NUMBER
      })
    }
    // Find the user by phone number
    const user = await AppUser.findOne({ phone })

    if (!user || !user.password) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Compare password
    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid password",
        errorCode: ErrorCode.INVALID_PASSWORD
      })
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(
      user._id,
      user.role,
      UserType.AppUser
    )
    const refreshToken = await generateRefreshToken(
      user._id,
      user.role,
      UserType.AppUser
    )

    const { password: _, ...userWithoutPassword } = user.toObject()
    // Return tokens and user data
    return res.status(200).json({
      message: "Login successful",
      data: { accessToken, refreshToken, user: userWithoutPassword }
    })
  } catch (error) {
    return res.status(500).json({
      message: "Server error during login",
      error
    })
  }
}
