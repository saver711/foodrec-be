import Meal from "@models/meal.model" // Import the meal model
import { Request, Response } from "express"

export const getMealById = async (req: Request, res: Response) => {
  const { id } = req.params
  const { populate } = req.query

  try {
    // Find the meal by ID
    let query = Meal.findById(id)

    // Dynamically populate fields if 'populate' query parameter is provided
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim())
      })
    }

    const meal = await query.exec()

    if (!meal) {
      return res.status(404).json({
        message: "Meal not found",
        ErrorCode: "MEAL_NOT_FOUND"
      })
    }

    res.status(200).json({
      data: meal,
      message: "Meal fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Error fetching meal",
      error
    })
  }
}
