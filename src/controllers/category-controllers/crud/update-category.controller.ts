import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import Recommendation from "@models/recommendation.model"
import { Request, Response } from "express"
import mongoose from "mongoose"

// Update a category by ID
export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, recommendations } = req.body

  try {
    // Find the category to be updated
    const category = await Category.findById(id)
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    // Check if the new name already exists for another category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ name })
      if (
        existingCategory &&
        (existingCategory._id as mongoose.Types.ObjectId).toString() !== id
      ) {
        return res.status(400).json({
          message: "Category name already exists",
          errorCode: ErrorCode.CATEGORY_ALREADY_EXISTS
        })
      }
    }

    // Handle recommendations being updated
    if (recommendations && recommendations.length > 0) {
      // Ensure recommendations exist
      const validRecommendations = await Recommendation.find({
        _id: { $in: recommendations }
      })
      if (validRecommendations.length !== recommendations.length) {
        return res.status(404).json({
          message: "One or more recommendations not found",
          errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND
        })
      }

      // Add this category to the recommendations if they were not previously in this category
      await Recommendation.updateMany(
        { _id: { $in: recommendations } },
        { $addToSet: { categories: category._id } } // Use $addToSet to avoid duplicates
      )
    }

    // Update category details
    category.name = name || category.name
    category.recommendations = recommendations || category.recommendations

    await category.save()

    res.status(200).json({
      message: "Category updated successfully",
      data: category
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to update category"
    })
  }
}
