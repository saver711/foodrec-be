import { Request, Response } from "express"
import AppUser from "@models/app-user.model"
import Blogger from "@models/blogger.model"
import { ErrorCode } from "@models/api/error-code.enum"
import { deleteFileFromGCS } from "@utils/gcs.util" // Utility function for deleting files from GCS
import path from "path"

// Delete App User
export const deleteAppUser = async (req: Request, res: Response) => {
  const userId = req.params.id // Assume the ID of the user to be deleted is passed as a URL parameter

  try {
    // Find the user to delete
    const user = await AppUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "App User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Delete the user's profile image from GCS (if they have one)
    if (user.image) {
      const oldImageFileName = path.basename(user.image)
      await deleteFileFromGCS(`app-users/${oldImageFileName}`)
    }

    // Remove the user from the followers list of bloggers they follow
    if (user.following && user.following.length > 0) {
      await Blogger.updateMany(
        { followers: user._id }, // Bloggers followed by the user
        { $pull: { followers: user._id } } // Remove user from the followers list
      )
    }

    // Delete the user
    await user.deleteOne()

    res.status(200).json({
      message: "App User deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Error deleting App User",
      error
    })
  }
}
