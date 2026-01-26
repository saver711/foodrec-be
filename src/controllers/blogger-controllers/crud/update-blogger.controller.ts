import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import {
  deleteFileFromS3,
  uploadFileToS3,
  isFileSameAsS3
} from "@utils/s3.util"
import { NextFunction, Request, Response } from "express"
import path from "node:path"

export const updateBlogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, bio, socialLinks, followers } = req.body
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

    // Update the blogger details
    blogger.name = name || blogger.name
    blogger.bio = bio || blogger.bio
    blogger.socialLinks = socialLinks || blogger.socialLinks
    blogger.followers = followers || blogger.followers

    // Handle image update
    if (file) {
      // File is uploaded
      if (blogger.image) {
        // Check if uploaded file is the same as existing one
        const oldImageFileName = path.basename(blogger.image)
        const s3FilePath = `bloggers/${oldImageFileName}`
        const isSameFile = await isFileSameAsS3(file, s3FilePath)

        if (!isSameFile) {
          // Files are different - delete old one and upload new one
          await deleteFileFromS3(s3FilePath)
          const imageUrl = await uploadFileToS3(file, "bloggers")
          blogger.image = imageUrl
        }
        // If files are the same, do nothing (keep existing image)
      } else {
        // No existing image - just upload new one
        const imageUrl = await uploadFileToS3(file, "bloggers")
        blogger.image = imageUrl
      }
    } else if (blogger.image) {
      // No file uploaded - delete old image if it exists
      const oldImageFileName = path.basename(blogger.image)
      await deleteFileFromS3(`bloggers/${oldImageFileName}`)
      blogger.image = ""
    }

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
