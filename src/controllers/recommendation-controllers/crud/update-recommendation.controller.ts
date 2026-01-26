import { ErrorCode } from "@models/api/error-code.enum"
import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
import {
  deleteFilesFromS3,
  uploadFilesToS3,
  compareMultipleFilesWithS3
} from "@utils/s3.util"
import { Request, Response } from "express"
import mongoose from "mongoose"
import path from "node:path"

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
    categoriesIds,
    restaurantId,
    locationsCriteria,
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

    // Update recommendation fields
    recommendation.blogger = bloggerId
    recommendation.quote = quote
    // Handle rating - it might come as array from frontend, extract first element
    const ratingValue = Array.isArray(rating) ? rating[0] : rating
    recommendation.rating = ratingValue !== undefined && ratingValue !== null ? Number(ratingValue) : undefined
    recommendation.date = date
    recommendation.url = url
    recommendation.mealName = mealName
    recommendation.mealDescription = mealDescription
    recommendation.categories = categoriesIds.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    )
    recommendation.restaurant = new mongoose.Types.ObjectId(restaurantId)

    // Handle meal images update
    if (files?.length) {
      const oldMealImages = recommendation.mealImages || []
      
      // Compare uploaded files with existing files in S3
      const {
        filesToKeep,
        filesToUpload,
        filesToDelete
      } = await compareMultipleFilesWithS3(
        files,
        oldMealImages,
        "recommendations"
      )

      // Delete old files that don't match any uploaded file
      if (filesToDelete.length > 0) {
        const fileNamesToDelete = filesToDelete.map(img =>
          path.basename(img)
        )
        await deleteFilesFromS3(fileNamesToDelete, "recommendations")
      }

      // Upload new files that don't match existing files
      let newImageUrls: string[] = []
      if (filesToUpload.length > 0) {
        newImageUrls = await uploadFilesToS3(filesToUpload, "recommendations")
      }

      // Combine kept files and newly uploaded files
      recommendation.mealImages = [...filesToKeep, ...newImageUrls]
    } else if (
      recommendation.mealImages &&
      recommendation.mealImages.length > 0
    ) {
      // No files uploaded - delete all old images if they exist
      const oldMealImages = recommendation.mealImages
      const fileNames = oldMealImages.map(img => path.basename(img))
      await deleteFilesFromS3(fileNames, "recommendations")
      recommendation.mealImages = []
    }

    await recommendation.save()

    // Handle locations update
    if (locationsCriteria === "ALL_LOCATIONS") {
      // Remove from all old restaurant locations
      await Location.updateMany(
        { restaurant: oldRestaurantId },
        { $pull: { recommendations: recommendation._id } }
      )
      // Add to all new restaurant locations
      await Location.updateMany(
        { restaurant: restaurantId },
        { $push: { recommendations: recommendation._id } }
      )
    } else {
      const selectedLocations = Array.isArray(locations)
        ? locations.map((loc: string) => new mongoose.Types.ObjectId(loc))
        : []

      // Remove from all current locations
      await Location.updateMany(
        { recommendations: recommendation._id },
        { $pull: { recommendations: recommendation._id } }
      )
      // Add to selected locations
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
