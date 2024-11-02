import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import Category from "@models/category.model"
import Recommendation from "@models/recommendation.model"
import Restaurant from "@models/restaurant.model"
import { deleteFilesFromGCS, uploadFilesToGCS } from "@utils/gcs.util" // Assuming these utilities exist
import { Request, Response } from "express"
import mongoose from "mongoose"
import path from "path"

// Update a recommendation by ID
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
    restaurantId,
    categories
  } = req.body
  const files = req.files as Express.Multer.File[] // New images uploaded

  try {
    if (!categories) {
      return res.status(404).json({
        message: "Categories not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    // Find the recommendation by ID
    const recommendation = await Recommendation.findById(id)
    if (!recommendation) {
      return res.status(404).json({
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND,
        message: "Recommendation not found"
      })
    }

    const oldBloggerId = recommendation.blogger.toString()
    const oldRestaurantId = recommendation.restaurant.toString()
    const oldMealImages = recommendation.mealImages

    // Check for duplicate recommendation with the same blogger, restaurant, and mealName
    const existingRecommendation = await Recommendation.findOne({
      restaurant: restaurantId || recommendation.restaurant,
      blogger: bloggerId || recommendation.blogger,
      mealName: mealName || recommendation.mealName,
      _id: { $ne: recommendation._id } // Exclude the current recommendation
    })

    if (existingRecommendation) {
      return res.status(400).json({
        message:
          "A recommendation for this meal by this blogger already exists",
        errorCode: ErrorCode.RECOMMENDATION_ALREADY_EXISTS
      })
    }

    // If the blogger is being updated, validate the new blogger
    if (bloggerId && bloggerId !== oldBloggerId) {
      const blogger = await Blogger.findById(bloggerId)
      if (!blogger) {
        return res.status(404).json({
          errorCode: ErrorCode.BLOGGER_NOT_FOUND,
          message: "Blogger not found"
        })
      }

      // Remove recommendation from the old blogger's recommendations list
      const oldBlogger = await Blogger.findById(oldBloggerId)
      if (oldBlogger) {
        oldBlogger.recommendations = oldBlogger.recommendations.filter(
          recId => recId.toString() !== recommendation._id.toString()
        )
        await oldBlogger.save()
      }
      recommendation.blogger = bloggerId
    }

    // If the restaurant is being updated, validate the new restaurant
    if (restaurantId && restaurantId !== oldRestaurantId) {
      const restaurant = await Restaurant.findById(restaurantId)
      if (!restaurant) {
        return res.status(404).json({
          errorCode: ErrorCode.RESTAURANT_NOT_FOUND,
          message: "Restaurant not found"
        })
      }

      // Remove recommendation from the old restaurant's recommendations list
      await Restaurant.findByIdAndUpdate(oldRestaurantId, {
        $pull: { recommendations: recommendation._id }
      })

      // Add recommendation to the new restaurant's recommendations list
      restaurant.recommendations.push(
        recommendation._id as mongoose.Types.ObjectId
      )
      await restaurant.save()

      recommendation.restaurant = restaurantId
    }

    // Update categories
    if (categories && Array.isArray(categories)) {
      const validCategories = await Category.find({ _id: { $in: categories } })
      if (validCategories.length !== categories.length) {
        return res.status(404).json({
          message: "One or more categories not found",
          errorCode: ErrorCode.CATEGORY_NOT_FOUND
        })
      }

      recommendation.categories = categories
    }

    // Update other fields
    if (quote) recommendation.quote = quote
    if (rating !== undefined) recommendation.rating = rating
    if (date) recommendation.date = date
    if (url) recommendation.url = url
    if (mealName) recommendation.mealName = mealName
    if (mealDescription) recommendation.mealDescription = mealDescription

    // Handle meal images
    if (files && files.length > 0) {
      // Delete old images from GCS
      if (oldMealImages && oldMealImages.length > 0) {
        const fileNames = oldMealImages.map(img => path.basename(img))
        await deleteFilesFromGCS(fileNames, "recommendations")
      }

      // Upload new images to GCS
      const uploadedImages = await uploadFilesToGCS(files, "recommendations")
      recommendation.mealImages = uploadedImages
    }

    await recommendation.save()

    // Attach the recommendation to the blogger (if updated)
    if (bloggerId && bloggerId !== oldBloggerId) {
      await Blogger.findByIdAndUpdate(bloggerId, {
        $push: { recommendations: recommendation._id }
      })
    }

    res.status(200).json({
      data: recommendation,
      message: "Recommendation updated successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to update recommendation"
    })
  }
}
