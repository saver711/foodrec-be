import { ErrorCode } from "@models/api/error-code.enum"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"

// Fetch a restaurant by ID and dynamically populate fields
export const getRestaurantById = async (req: Request, res: Response) => {
  const { id } = req.params
  const { populate } = req.query // Extract the fields to populate from query parameters

  try {
    let query = Restaurant.findById(id)

    // If 'populate' fields are provided, dynamically populate them
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",") // Split the fields by comma
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim()) as unknown as typeof query // Dynamically apply population for each field
      })
    }

    const restaurant = await query.exec()

    if (!restaurant) {
      return res.status(404).json({
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND,
        message: "Restaurant not found"
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
