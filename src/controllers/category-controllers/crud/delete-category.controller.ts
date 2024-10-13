import { Request, Response } from "express"
import Category from "@models/category.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Delete a category by ID
export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const deletedCategory = await Category.findByIdAndDelete(id)

    if (!deletedCategory) {
      return res.status(404).json({
        message: "Category not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    res.status(200).json({
      message: "Category deleted successfully",
      data: deletedCategory
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to delete category"
    })
  }
}
