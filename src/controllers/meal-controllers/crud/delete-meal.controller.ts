import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import Meal from "@models/meal.model"
import Recommendation from "@models/recommendation.model"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"

// Delete a meal
export const deleteMeal = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const meal = await Meal.findById(id)
    if (!meal) {
      return res.status(404).json({
        message: "Meal not found",
        errorCode: ErrorCode.MEAL_NOT_FOUND
      })
    }

    // Delete associated recommendations
    // await Recommendation.deleteMany({ meal: meal._id })

    // Remove the meal from the associated restaurants
    // await Restaurant.updateMany({ meals: id }, { $pull: { meals: id } })

    // Remove the meal from the associated categories
    // await Category.updateMany({ meals: id }, { $pull: { meals: id } })

    // Finally, delete the meal itself
    await Meal.findByIdAndDelete(id)

    res.status(200).json({ message: "Meal deleted successfully" })
  } catch (error) {
    res.status(500).json({
      message: "Error deleting meal",
      error
    })
  }
}
