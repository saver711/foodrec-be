import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { UserType } from "@models/user-type.enum"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import { Request, Response } from "express"

// Verify OTP for Phone Registration
export const verifyOtp = async (req: Request, res: Response) => {
  const { _id, otp } = req.body

  try {
    // Find the user by userId
    const user = await AppUser.findOne({ _id })
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "User is already verified",
        errorCode: ErrorCode.USER_ALREADY_VERIFIED
      })
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
        errorCode: ErrorCode.INVALID_OTP
      })
    }

    // Mark the user as verified and clear OTP
    user.isVerified = true
    user.otp = undefined // Clear OTP after verification
    await user.save()

    // Generate JWT token
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

    const { password, ...userWithoutPassword } = user.toObject()
    return res.status(200).json({
      message: "Verified successfully",
      data: { accessToken, refreshToken, user: userWithoutPassword }
    })
  } catch (error) {
    res.status(500).json({
      message: "Server error during OTP verification",
      error
    })
  }
}
