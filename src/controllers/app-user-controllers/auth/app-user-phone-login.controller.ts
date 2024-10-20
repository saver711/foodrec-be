import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { UserType } from "@models/user-type.enum"
import { compare } from "@utils/compare.util" // Utility to compare hashed password
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import { Request, Response } from "express"

// Login App User (Phone-based login with OTP)
export const appUserPhoneLogin = async (req: Request, res: Response) => {
  const { phone, password, otp } = req.body

  try {
    // Find the user by phone number
    const user = await AppUser.findOne({ phone })

    if (!user || !user.password) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Check if user is not verified
    // if (!user.isVerified) {
    //   // Verify OTP
    //   const isOtpValid = await verifyOtp(otp, user.otp)
    //   if (!isOtpValid) {
    //     return res.status(400).json({
    //       message: "Invalid OTP",
    //       errorCode: ErrorCode.INVALID_OTP
    //     })
    //   }

    //   // Mark user as verified after OTP validation
    //   user.isVerified = true
    //   await user.save()
    // }

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
      data: { accessToken, refreshToken, user }
    })
  } catch (error) {
    return res.status(500).json({
      message: "Server error during login",
      error
    })
  }
}
