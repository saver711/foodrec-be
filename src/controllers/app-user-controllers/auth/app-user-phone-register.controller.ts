import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { UserType } from "@models/user-type.enum"
import { generateOtp, sendOtp } from "@utils/auth/otp.util" // Assuming you have these utilities for OTP
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util"
import { hash } from "@utils/hash.util" // Utility to hash password
import { Request, Response } from "express"
import { egyptianPhoneRegex } from 'src/consts/egyptian-phone-regex'

// Register App User
export const appUserPhoneRegister = async (req: Request, res: Response) => {
  const { name, phone, password } = req.body

  try {
    if (!egyptianPhoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Must be like 01×12345678",
        errorCode: ErrorCode.INVALID_PHONE_NUMBER
      })
    }

    // Validate request input
    if (!name) {
      return res.status(400).json({
        message: "Name is required",
        errorCode: ErrorCode.NAME_IS_REQUIRED
      })
    }

    // Check for Google or Phone registration
    if (phone) {
      // Phone Registration with OTP
      const existingUser = await AppUser.findOne({ phone })
      if (existingUser) {
        return res.status(400).json({
          message: "Phone number already registered",
          errorCode: ErrorCode.USER_ALREADY_EXISTS
        })
      }

      // Generate OTP and send it
      const newOTP = generateOtp() // Assume this generates a 6-digit OTP
      await sendOtp(phone, newOTP) // Assume this sends OTP via SMS

      // Hash password before saving
      const hashedPassword = await hash(password)

      // Create new phone user with OTP
      const newUser = new AppUser({
        name,
        phone,
        password: hashedPassword,
        otp: newOTP, // Store the generated OTP
        isVerified: false // Not verified until OTP is confirmed
      })

      await newUser.save()

      const accessToken = generateAccessToken(
        newUser._id,
        newUser.role,
        UserType.AppUser
      )
      const refreshToken = await generateRefreshToken(
        newUser._id,
        newUser.role,
        UserType.AppUser
      )

      const { password: _, otp, ...userWithoutPassword } = newUser.toObject()

      return res.status(201).json({
        message: "OTP sent to phone",
        data: { user: userWithoutPassword, accessToken, refreshToken }
      })
    } else {
      return res.status(400).json({
        message: "Phone number must be provided",
        errorCode: ErrorCode.MISSING_GOOGLE_ID_OR_PHONE
      })
    }
  } catch (error) {
    res.status(500).json({
      message: "Server error during registration",
      error
    })
  }
}
