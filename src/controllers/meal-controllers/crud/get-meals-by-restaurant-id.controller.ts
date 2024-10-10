import { Request, Response } from "express"
import Meal from "@models/meal.model"
import { ErrorCode } from "@models/api/error-code.enum"

export const getMealsByRestaurant = async (req: Request, res: Response) => {
  const { restaurantId } = req.params

  try {
    const meals = await Meal.find({ restaurant: restaurantId })
    if (!meals) {
      return res.status(404).json({
        message: "No meals found for this restaurant",
        errorCode: ErrorCode.NO_MEALS_FOR_RESTAURANT
      })
    }
    res.status(200).json({ message: "Meals fetched successfully", data: meals })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
