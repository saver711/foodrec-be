import { Request, Response } from "express"
import Restaurant from "@models/restaurant.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Delete multiple restaurants by IDs
export const deleteMultiRestaurants = async (
  req: Request,
  res: Response
) => {
  const { restaurantIds } = req.body // Expecting an array of restaurant IDs

  if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
    return res.status(400).json({
      errorCode: ErrorCode.DATA_SHOULD_BE_MULTIPLE,
      message: "Invalid or empty restaurantIds provided"
    })
  }

  try {
    // Find all restaurants by IDs
    const restaurants = await Restaurant.find({
      _id: { $in: restaurantIds }
    })

    if (restaurants.length === 0) {
      return res.status(404).json({
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND,
        message: "No restaurants found for the provided IDs"
      })
    }

    // Delete the restaurants
    await Restaurant.deleteMany({ _id: { $in: restaurantIds } })

    res.status(200).json({
      message: "Restaurants and related data deleted successfully",
      deletedCount: restaurants.length
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to delete restaurants"
    })
  }
}
