import { Request, Response } from "express"
import Category from "@models/category.model"
import { ErrorCode } from "@models/api/error-code.enum"

export const createCategory = async (req: Request, res: Response) => {
  const { name } = req.body

  try {
    // Check if the category already exists
    const existingCategory = await Category.findOne({ name })
    if (existingCategory) {
      return res.status(400).json({
        errorCode: ErrorCode.CATEGORY_ALREADY_EXISTS, // Assuming you have this error code
        message: "Category with this name already exists"
      })
    }

    const category = new Category({ name })
    await category.save()

    res.status(201).json({
      data: category,
      message: "Category created successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to create category"
    })
  }
}
