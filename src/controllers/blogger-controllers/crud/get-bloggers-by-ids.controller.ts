import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import { Request, Response } from "express"

// Get bloggers by IDs (accessible by SUPER_ADMIN, AUDITOR, and APP_USER)
export const getBloggersByIds = async (req: Request, res: Response) => {
  const { bloggersIds } = req.body
  const { populate } = req.query

  if (!bloggersIds || typeof bloggersIds !== "string") {
    return res.status(400).json({
      message: "Invalid or missing blogger IDs",
      errorCode: ErrorCode.MISSING_DATA
    })
  }

  const bloggersIdsArray = bloggersIds.split(",").map(id => id.trim())

  if (bloggersIdsArray.length === 0) {
    return res.status(400).json({
      message: "Invalid or missing blogger IDs",
      errorCode: ErrorCode.MISSING_DATA
    })
  }

  try {
    let query = Blogger.find({ _id: { $in: bloggersIdsArray } }).lean()

    // Dynamically populate fields if requested
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim()) as unknown as typeof query
      })
    }

    const bloggers = await query.exec()

    if (!bloggers || bloggers.length === 0) {
      return res.status(404).json({
        message: "Bloggers not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    return res.status(200).json({
      data: bloggers,
      message: "Bloggers fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch bloggers"
    })
  }
}
