import { ErrorCode } from "@models/api/error-code.enum"
import Blogger, { IBlogger } from "@models/blogger.model"
import { uploadFileToGCS } from "@utils/gcs.util"
import { Request, Response } from "express"

export const createBlogger = async (req: Request, res: Response) => {
  const { name, bio, socialLinks } = req.body

  try {
    const existingBlogger = await Blogger.findOne({ name })
    if (existingBlogger) {
      return res.status(400).json({
        errorCode: ErrorCode.BLOGGER_ALREADY_EXISTS,
        message: "Blogger with this name already exists"
      })
    }

    // If image is uploaded
    let imageUrl = ""
    const imageFile = req.file
    if (imageFile) {
      imageUrl = await uploadFileToGCS(imageFile, "bloggers") // Specify folder
    }

    // Create a new blogger with the image URL
    const blogger: IBlogger = new Blogger({
      name,
      bio,
      socialLinks,
      image: imageUrl // Store image URL
    })

    await blogger.save()
    res
      .status(201)
      .json({ message: "Blogger added successfully", data: blogger })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
