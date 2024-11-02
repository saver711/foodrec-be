import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import Recommendation from "@models/recommendation.model"
import { Request, Response } from "express"

// Delete a category by ID
export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // Find the category to delete
    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    // Find all recommendations associated with this category
    const recommendationsIds = category.recommendations

    // Delete all recommendations associated with the category
    if (recommendationsIds.length > 0) {
      await Recommendation.deleteMany({ _id: { $in: recommendationsIds } })
    }

    // Finally, delete the category itself
    await category.deleteOne()

    res.status(200).json({
      message: "Category and related recommendations deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Error deleting category",
      error
    })
  }
}
