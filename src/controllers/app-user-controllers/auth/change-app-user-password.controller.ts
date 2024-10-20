import { Request, Response } from "express"
import AppUser from "@models/app-user.model"
import { hash } from "@utils/hash.util" // Utility functions to compare and hash passwords
import { ErrorCode } from "@models/api/error-code.enum"
import { compare } from "@utils/compare.util"

// Change password for app user
export const changeAppUserPassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user?.userId // Assume userId is attached via authentication middleware

  try {
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
        errorCode: ErrorCode.PASSWORDS_REQUIRED
      })
    }

    // Find the user
    const user = await AppUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Compare current password with the stored password
    const isMatch = await compare(currentPassword, user.password!)
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect current password",
        errorCode: ErrorCode.INCORRECT_CURRENT_PASSWORD
      })
    }

    // Hash the new password
    const hashedNewPassword = await hash(newPassword)

    // Update the user's password
    user.password = hashedNewPassword
    await user.save()

    res.status(200).json({
      message: "Password changed successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Server error while changing password",
      error
    })
  }
}
