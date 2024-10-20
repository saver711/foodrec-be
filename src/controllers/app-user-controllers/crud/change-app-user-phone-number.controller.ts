import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { generateOtp, sendOtp } from "@utils/auth/otp.util"
import { Request, Response } from "express"
import { egyptianPhoneRegex } from "src/consts/egyptian-phone-regex"

export const changeAppUserPhoneNumber = async (req: Request, res: Response) => {
  const userId = req.user?.userId
  const { phone } = req.body

  try {
    // Validate phone number format
    if (!egyptianPhoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Must be like 01×12345678",
        errorCode: ErrorCode.INVALID_PHONE_NUMBER
      })
    }

    // Find the user by ID
    const user = await AppUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "App User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Check if the user was originally registered with a phone number (not Google)
    if (user.googleId) {
      return res.status(400).json({
        message:
          "Phone number cannot be changed for users registered with Google",
        errorCode: ErrorCode.ORIGINALLY_REGISTERED_WITH_GOOGLE
      })
    }

    // Check if the phone number is already registered
    const existingUser = await AppUser.findOne({ phone })
    if (existingUser) {
      return res.status(400).json({
        message: "Phone number already registered",
        errorCode: ErrorCode.PHONE_ALREADY_REGISTERED
      })
    }

    // Generate and send OTP for phone verification
    const otp = generateOtp() // Generate a 6-digit OTP
    await sendOtp(phone, otp)

    // Update phone number and mark the user as unverified
    user.phone = phone
    user.isVerified = false
    user.otp = otp

    await user.save()

    res.status(200).json({
      message: "Phone number updated successfully. OTP sent for verification.",
      data: { userId: user._id }
    })
  } catch (error) {
    res.status(500).json({
      message: "Error changing phone number",
      error
    })
  }
}
