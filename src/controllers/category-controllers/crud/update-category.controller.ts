import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import { Request, Response } from "express"

// Update a category by ID (SUPER_ADMIN only)
export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, meals } = req.body

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, meals },
      { new: true }
    )

    if (!updatedCategory) {
      return res.status(404).json({
        message: "Category not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    res.status(200).json({
      message: "Category updated successfully",
      data: updatedCategory
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to update category"
    })
  }
}
