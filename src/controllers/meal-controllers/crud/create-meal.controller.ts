import { Request, Response } from "express"
import Meal from "@models/meal.model"
import Category from "@models/category.model"
import Restaurant from "@models/restaurant.model"
import { ErrorCode } from "@models/api/error-code.enum"
import mongoose from "mongoose"
import { uploadFilesToGCS } from "@utils/gcs.util" // Import the new utility function

// Create a meal
export const createMeal = async (req: Request, res: Response) => {
  const { name, description, categories, restaurantId } = req.body
  const files = req.files as Express.Multer.File[] // Uploaded files

  try {
    // Check if the restaurant exists
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    // Check if a meal with the same name already exists under the same restaurant
    const existingMeal = await Meal.findOne({ name, restaurant: restaurantId })
    if (existingMeal) {
      return res.status(400).json({
        message:
          "A meal with the same name already exists under this restaurant",
        errorCode: ErrorCode.MEAL_ALREADY_EXISTS
      })
    }

    // Validate and attach categories
    const validCategories = await Category.find({ _id: { $in: categories } })
    if (validCategories.length !== categories.length) {
      return res.status(404).json({
        message: "One or more categories not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    // Upload images to Google Cloud Storage
    let uploadedImages: string[] = []
    if (files && files.length > 0) {
      uploadedImages = await uploadFilesToGCS(files, "meals") // Use the new utility function
    }

    // Create the meal
    const meal = new Meal({
      name,
      description,
      images: uploadedImages, // Add image URLs
      categories,
      restaurant: restaurantId
    })

    await meal.save()

    // Attach meal to the restaurant
    restaurant.meals.push(meal._id as mongoose.Types.ObjectId)
    await restaurant.save()

    // Attach meal to categories
    validCategories.forEach(async category => {
      category.meals.push(meal._id as mongoose.Types.ObjectId)
      await category.save()
    })

    res.status(201).json({ data: meal, message: "Meal created successfully" })
  } catch (error) {
    res.status(500).json({ message: "Failed to create meal", error })
  }
}
