import { ErrorCode } from "@models/api/error-code.enum"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"

// Delete a restaurant by ID
export const deleteRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // Find the restaurant to delete
    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    await Restaurant.findOneAndDelete({_id: id})

    return res.status(200).json({
      message:
        "Restaurant and related recommendations and locations deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting restaurant:", error) // Log the exact error
    res.status(500).json({ message: "Error deleting restaurant", error })
  }
}
