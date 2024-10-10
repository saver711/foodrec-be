import bcrypt from "bcryptjs"
import { Request, Response } from "express"
import { ErrorCode } from "@models/api/error-code.enum"
import AppUser, { IAppUser } from "@models/app-user.model"
// Change Mobile App User Password
export const changeAppUserPassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body

  try {
    const user = await AppUser.findById((req.user as IAppUser).userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect current password",
        errorCode: ErrorCode.INCORRECT_CURRENT_PASSWORD
      })
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update the user's password
    user.password = hashedPassword
    await user.save()

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
