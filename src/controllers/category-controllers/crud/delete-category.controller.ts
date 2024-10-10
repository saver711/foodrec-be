import Meal from "@models/meal.model"
import { Request, Response } from "express"

// Delete a meal by ID
export const deleteMeal = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const deletedMeal = await Meal.findByIdAndDelete(id)
    if (!deletedMeal) return res.status(404).json({ message: "Meal not found" })

    res.status(200).json({ message: "Meal deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting meal", error })
  }
}
