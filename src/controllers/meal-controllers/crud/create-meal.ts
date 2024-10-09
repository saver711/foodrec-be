import { Request, Response } from "express"
import Meal from "@models/meal.model"

export const createMeal = async (req: Request, res: Response) => {
  const { name, description, images, categories, likedBy, recommendations } =
    req.body

  try {
    const meal = new Meal({
      name,
      description,
      images,
      categories,
      likedBy,
      recommendations
    })

    await meal.save()
    res.status(201).json({ message: "Meal added successfully", data: meal })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
