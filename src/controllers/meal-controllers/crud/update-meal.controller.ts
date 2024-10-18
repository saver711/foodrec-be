import Meal from "@models/meal.model"
import Restaurant from "@models/restaurant.model"
import Category from "@models/category.model"
import { deleteFilesFromGCS, uploadFilesToGCS } from "@utils/gcs.util" // Import GCS utility functions
import { Request, Response } from "express"
import mongoose from "mongoose"

// Update a meal by ID
export const updateMeal = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, description, categories, restaurantId } = req.body
  const files = req.files as Express.Multer.File[] // Get uploaded images

  try {
    // Find the meal by ID
    const meal = await Meal.findById(id)
    if (!meal) {
      return res.status(404).json({
        message: "Meal not found"
      })
    }

    // Check if the restaurant is changed
    if (restaurantId && !meal.restaurant.equals(restaurantId)) {
      // Remove the meal from the old restaurant
      await Restaurant.updateOne(
        { _id: meal.restaurant },
        { $pull: { meals: meal._id } }
      )

      // Add the meal to the new restaurant
      await Restaurant.updateOne(
        { _id: restaurantId },
        { $push: { meals: meal._id } }
      )

      meal.restaurant = new mongoose.Types.ObjectId(restaurantId as string)
    }

    // Check if categories are changed
    if (categories) {
      const oldCategories = meal.categories

      // Remove the meal from the old categories
      await Category.updateMany(
        { _id: { $in: oldCategories } },
        { $pull: { meals: meal._id } }
      )

      // Add the meal to the new categories
      await Category.updateMany(
        { _id: { $in: categories } },
        { $push: { meals: meal._id } }
      )

      meal.categories = categories
    }

    // If new images are uploaded, delete old images from GCS and upload new ones
    if (files && files.length > 0) {
      if (meal.images && meal.images.length > 0) {
        // Delete the old images from GCS
        await deleteFilesFromGCS(meal.images, "meals")
      }

      // Upload new images to GCS
      const uploadedImages = await uploadFilesToGCS(files, "meals")
      meal.images = uploadedImages // Update images with the new ones
    }

    // Update the meal with new data
    meal.name = name || meal.name
    meal.description = description || meal.description

    // Save the updated meal
    await meal.save()

    res.status(200).json({ message: "Meal updated successfully", data: meal })
  } catch (error) {
    res.status(500).json({ message: "Error updating meal", error })
  }
}
