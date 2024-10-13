import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import { deleteFileFromGCS, uploadFileToGCS } from "@utils/gcs.util" // Assume these functions are created
import { NextFunction, Request, Response } from "express"
import path from "path"

export const updateBlogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, bio, socialLinks, recommendations, followers } = req.body
  const { id } = req.params
  const file = req.file // Image file passed through the request

  try {
    // Find the blogger by ID
    const blogger = await Blogger.findById(id)
    if (!blogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    // If there's a new image file, delete the old image from GCS and upload the new one
    let imageUrl = blogger.image // Keep the current image URL
    if (file) {
      if (blogger.image) {
        // Extract the filename from the current image URL
        const oldImageFileName = path.basename(blogger.image)
        // Delete the old image from GCS
        await deleteFileFromGCS(`bloggers/${oldImageFileName}`)
      }

      // Upload the new image to GCS
      imageUrl = await uploadFileToGCS(file, "bloggers")
    }

    // Update the blogger details
    blogger.name = name || blogger.name
    blogger.bio = bio || blogger.bio
    blogger.socialLinks = socialLinks || blogger.socialLinks
    blogger.recommendations = recommendations || blogger.recommendations
    blogger.followers = followers || blogger.followers
    blogger.image = imageUrl // Update with the new image URL

    // Save the updated blogger
    await blogger.save()

    return res.status(200).json({
      message: "Blogger updated successfully",
      data: blogger
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
