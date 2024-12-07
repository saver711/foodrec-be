import { ErrorCode } from "@models/api/error-code.enum"
import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
import { deleteFilesFromGCS, uploadFilesToGCS } from "@utils/gcs.util"
import { Request, Response } from "express"
import mongoose from "mongoose"
import path from "path"

// TODO:
/* NOT USED
 bloggerId,
    quote,
    rating,
    date,
    url,
    mealName,
    mealDescription,
    categories,

*/
export const updateRecommendation = async (req: Request, res: Response) => {
  const { id } = req.params
  const {
    bloggerId,
    quote,
    rating,
    date,
    url,
    mealName,
    mealDescription,
    categories,
    restaurantId,
    locations
  } = req.body
  const files = req.files as Express.Multer.File[]

  try {
    const recommendation = await Recommendation.findById(id)
    if (!recommendation)
      return res.status(404).json({
        message: "Recommendation not found",
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND
      })

    const oldRestaurantId = recommendation.restaurant.toString()

    // Handle blogger, restaurant, categories, and other field updates...
    if (files?.length) {
      const oldMealImages = recommendation.mealImages
      const fileNames = oldMealImages.map(img => path.basename(img))
      await deleteFilesFromGCS(fileNames, "recommendations")

      const uploadedImages = await uploadFilesToGCS(files, "recommendations")
      recommendation.mealImages = uploadedImages
    }

    await recommendation.save()

    // Handle locations update
    if (locations === "ALL_LOCATIONS") {
      await Location.updateMany(
        { restaurant: oldRestaurantId },
        { $pull: { recommendations: recommendation._id } }
      )
      await Location.updateMany(
        { restaurant: restaurantId },
        { $push: { recommendations: recommendation._id } }
      )
    } else {
      const selectedLocations = Array.isArray(locations)
        ? locations.map((loc: string) => new mongoose.Types.ObjectId(loc))
        : []
      await Location.updateMany(
        { recommendations: recommendation._id },
        { $pull: { recommendations: recommendation._id } }
      )
      await Location.updateMany(
        { _id: { $in: selectedLocations } },
        { $push: { recommendations: recommendation._id } }
      )
    }

    res.status(200).json({
      data: recommendation,
      message: "Recommendation updated successfully"
    })
  } catch (error) {
    res.status(500).json({ message: "Failed to update recommendation", error })
  }
}
