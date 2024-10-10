import { NextFunction, Request, Response } from "express"
import Blogger from "@models/blogger.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Delete a blogger (SUPER_ADMIN only)
export const deleteBlogger = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const deletedBlogger = await Blogger.findByIdAndDelete(id)
    if (!deletedBlogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    res.status(200).json({ message: "Blogger deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
