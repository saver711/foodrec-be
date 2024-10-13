import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import { Request, Response } from "express"

// Get a blogger by ID (accessible by SUPER_ADMIN, AUDITOR, and APP_USER)
export const getBloggerById = async (req: Request, res: Response) => {
  const { bloggerId } = req.params
  const { populate } = req.query

  try {
    let query = Blogger.findById(bloggerId).lean()

    // Dynamically populate fields if requested
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim())
      })
    }

    const blogger = await query.exec()

    if (!blogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    return res.status(200).json({
      data: blogger,
      message: "Blogger fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch blogger"
    })
  }
}
