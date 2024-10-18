import { Request, Response } from "express"
import Restaurant from "@models/restaurant.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Get a restaurant by ID with dynamic population
export const getRestaurantById = async (req: Request, res: Response) => {
  const { id } = req.params
  const { populate } = req.query

  try {
    // Build the query to find the restaurant by ID
    let query = Restaurant.findById(id)

    // If populate query parameter is provided, split and apply dynamic population
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim())
      })
    }

    const restaurant = await query.exec()

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    res.status(200).json({
      data: restaurant,
      message: "Restaurant fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch restaurant"
    })
  }
}
