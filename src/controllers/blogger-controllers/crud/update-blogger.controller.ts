import { NextFunction, Request, Response } from "express"
import Blogger from "@models/blogger.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Update a blogger (SUPER_ADMIN only)
export const updateBlogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, bio, socialLinks, recommendations, image } = req.body
  const { id } = req.params

  try {
    const updatedBlogger = await Blogger.findByIdAndUpdate(
      id,
      { name, bio, image, socialLinks, recommendations },
      { new: true }
    )
    if (!updatedBlogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    await updatedBlogger.save()
    res
      .status(200)
      .json({ message: "Blogger updated successfully", data: updatedBlogger })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
