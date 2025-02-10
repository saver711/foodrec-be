import { ErrorCode } from "@models/api/error-code.enum"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"

// Get a restaurant by ID with dynamic population
export const getRestaurantsByIds = async (req: Request, res: Response) => {
  const { restaurantsIds } = req.body
  const { populate } = req.query

  if (!restaurantsIds || typeof restaurantsIds !== "string") {
    return res.status(400).json({
      message: "Invalid or missing restaurant IDs",
      errorCode: ErrorCode.MISSING_DATA
    })
  }

  const restaurantsIdsArray = restaurantsIds.split(",").map(id => id.trim())

  if (restaurantsIdsArray.length === 0) {
    return res.status(400).json({
      message: "Invalid or missing  restaurant IDs",
      errorCode: ErrorCode.MISSING_DATA
    })
  }

  try {
    let query = Restaurant.find({ _id: { $in: restaurantsIdsArray } }).lean()

    // If populate query parameter is provided, split and apply dynamic population
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim()) as unknown as typeof query
      })
    }

    const restaurants = await query.exec()

    if (!restaurants || restaurants.length === 0) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    res.status(200).json({
      data: restaurants,
      message: "Restaurant fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch restaurant"
    })
  }
}
