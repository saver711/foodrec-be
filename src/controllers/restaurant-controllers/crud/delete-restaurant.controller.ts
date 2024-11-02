import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
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

    // Find all recommendations associated with the restaurant
    const recommendations = await Recommendation.find({ restaurant: id })
    const recommendationsIds = recommendations.map(
      recommendation => recommendation._id
    )

    if (recommendationsIds.length > 0) {
      // Delete all recommendations associated with those recommendations
      await Recommendation.deleteMany({
        recommendation: { $in: recommendationsIds }
      })
      console.log("recommendations deleted")

      // Find all recommendations associated with those recommendations
      const recommendations = await Recommendation.find({
        recommendation: { $in: recommendationsIds }
      })
      const recommendationIds = recommendations.map(rec => rec._id)

      // Delete those recommendations from the bloggers' recommendations list
      if (recommendationIds.length > 0) {
        await Blogger.updateMany(
          { recommendations: { $in: recommendationIds } },
          { $pull: { recommendations: { $in: recommendationIds } } }
        )
      }
    }

    // Delete all recommendations associated with the restaurant
    await Recommendation.deleteMany({ restaurant: id })

    // Delete all locations associated with the restaurant
    await Location.deleteMany({ restaurant: id })

    // Finally, delete the restaurant itself
    await restaurant.deleteOne()
    console.log("restaurant deleted")

    res.status(200).json({
      message:
        "Restaurant and related recommendations and recommendations deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting restaurant:", error) // Log the exact error
    res.status(500).json({ message: "Error deleting restaurant", error })
  }
}
