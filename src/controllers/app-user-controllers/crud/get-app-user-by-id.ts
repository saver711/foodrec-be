import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { Request, Response } from "express"

// Get App User by ID
export const getAppUserById = async (req: Request, res: Response) => {
  const userId = req.params.id // Assume the ID of the user to be retrieved is passed as a URL parameter

  try {
    // Find the app user by ID
    const user = await AppUser.findById(userId).select("-password -otp") // Exclude sensitive fields like password and OTP

    if (!user) {
      return res.status(404).json({
        message: "App User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    res.status(200).json({
      message: "App User fetched successfully",
      data: user
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching App User",
      error
    })
  }
}
