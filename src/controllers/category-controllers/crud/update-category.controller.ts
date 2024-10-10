import { Request, Response } from "express"
import Meal from "@models/meal.model"

// Update a meal by ID
export const updateMeal = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params
  const { name, description, images, categories, likedBy, recommendations } =
    req.body

  try {
    const updatedMeal = await Meal.findByIdAndUpdate(
      id,
      { name, description, images, categories, likedBy, recommendations },
      { new: true }
    )
    if (!updatedMeal) return res.status(404).json({ message: "Meal not found" })

    res
      .status(200)
      .json({ message: "Meal updated successfully", data: updatedMeal })
  } catch (error) {
    res.status(500).json({ message: "Error updating meal", error })
  }
}