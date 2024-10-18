import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import Meal from "@models/meal.model"
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

    // Find all meals associated with this category
    const mealIds = category.meals

    // Delete all meals associated with the category
    if (mealIds.length > 0) {
      await Meal.deleteMany({ _id: { $in: mealIds } })
    }

    // Finally, delete the category itself
    await category.deleteOne()

    res.status(200).json({
      message: "Category and related meals deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Error deleting category",
      error
    })
  }
}
