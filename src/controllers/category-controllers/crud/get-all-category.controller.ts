import { Request, Response } from "express"
import Meal from "@models/meal.model"

// Get all meals
export const getAllMeals = async (req: Request, res: Response) => {
  try {
    const meals = await Meal.find().populate(
      "categories likedBy recommendations"
    )
    res.status(200).json({ data: meals })
  } catch (error) {
    res.status(500).json({ message: "Error fetching meals", error })
  }
}
