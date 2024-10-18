import { Request, Response } from "express"
import Category from "@models/category.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Get category by ID with dynamic population
export const getCategoryById = async (req: Request, res: Response) => {
  const { id } = req.params
  const { populate } = req.query

  try {
    let query = Category.findById(id).lean() // Use lean for better performance

    // Dynamically populate fields if requested
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim())
      })
    }

    const category = await query.exec()

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    return res.status(200).json({
      data: category,
      message: "Category fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch category"
    })
  }
}
