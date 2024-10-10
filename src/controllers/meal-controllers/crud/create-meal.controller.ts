import { Request, Response } from "express"
import Meal from "@models/meal.model"
import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import Restaurant from "@models/restaurant.model"
import mongoose from "mongoose"

export const createMeal = async (req: Request, res: Response) => {
  const { name, description, images, categories, restaurantId } = req.body

  try {
    // Validate that the category exists
    const categoryCheckPromises = categories.map((categoryId: string) =>
      Category.findById(categoryId)
    )
    const foundCategories = await Promise.all(categoryCheckPromises)
    const invalidCategories = foundCategories.filter(category => !category)

    if (invalidCategories.length > 0) {
      return res.status(404).json({
        errorCode: ErrorCode.CATEGORY_NOT_FOUND,
        message: "Category not found"
      })
    }

    // Validate that the restaurant exists
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND,
        message: "Restaurant not found"
      })
    }

    const meal = new Meal({
      name,
      description,
      images,
      categories,
      restaurant: restaurantId
    })

    await meal.save()

    // Add the meal to the restaurant's meals
    restaurant.meals.push(meal._id as mongoose.Types.ObjectId)
    await restaurant.save()
    // Add meal to the categories
    const updateCategoryPromises = foundCategories.map(category =>
      category!.meals.push(meal._id)
    )
    await Promise.all(updateCategoryPromises)
    await Promise.all(foundCategories.map(category => category!.save()))

    res.status(201).json({ message: "Meal added successfully", data: meal })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
