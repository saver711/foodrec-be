import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import { deleteFileFromGCS, uploadFileToGCS } from "@utils/gcs.util" // Import GCS utility functions
import { Request, Response } from "express"
import path from "path"
import { egyptianPhoneRegex } from "src/consts/egyptian-phone-regex"

export const updateAppUser = async (req: Request, res: Response) => {
  const { name, email, phone } = req.body
  const file = req.file // Get the uploaded profile image (if any)
  const userId = req.user?.userId

  try {
    if (phone && !egyptianPhoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number format. Must be like 01×12345678",
        errorCode: ErrorCode.INVALID_PHONE_NUMBER
      })
    }
    // Allow Super Admins to update any App User and App Users to update their own info
    const user = await AppUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "App User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Handle email update
    if (user.googleId) {
      // If the user is registered with Google, they cannot edit the email
      if (email) {
        return res.status(400).json({
          message: "Email cannot be edited for Google-registered users",
          errorCode: ErrorCode.EMAIL_CANNOT_BE_EDITED
        })
      }
    } else if (user.phone && email) {
      // If registered with phone, they can edit the email
      user.email = email
    }

    // Update name
    if (name) {
      user.name = name
    }

    // Handle phone number update for Google-registered users
    if (user.googleId && phone) {
      user.phone = phone // Allow updating the phone number
    }

    // Update profile image if uploaded
    let imageUrl = user.image
    if (file) {
      if (user.image) {
        const oldImageFileName = path.basename(user.image)
        await deleteFileFromGCS(`app-users/${oldImageFileName}`)
      }

      imageUrl = await uploadFileToGCS(file, "app-users")
    }

    user.image = imageUrl

    await user.save()

    const { password, ...userWithoutPassword } = user.toObject()
    res.status(200).json({
      message: "User info updated successfully",
      data: { user: userWithoutPassword }
    })
  } catch (error) {
    res.status(500).json({
      message: "Error updating user info",
      error
    })
  }
}
