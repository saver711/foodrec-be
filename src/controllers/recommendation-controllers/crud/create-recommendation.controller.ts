import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import Blogger from "@models/blogger.model"
import Restaurant from "@models/restaurant.model"
import Category from "@models/category.model"
import { ErrorCode } from "@models/api/error-code.enum"
import mongoose from "mongoose"
import { uploadFilesToGCS } from "@utils/gcs.util" // Assuming you have a utility for file uploads

// Create a new recommendation
export const createRecommendation = async (req: Request, res: Response) => {
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
  const files = req.files as Express.Multer.File[] // Uploaded images

  try {
    if (!categories) {
      return res.status(404).json({
        message: "Categories not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }
    // Check if the blogger exists
    const blogger = await Blogger.findById(bloggerId)
    if (!blogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    // Check if the restaurant exists
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    // Ensure that there is no existing recommendation for the same blogger and meal
    const existingRecommendation = await Recommendation.findOne({
      restaurant: restaurantId,
      blogger: bloggerId,
      mealName
    })
    if (existingRecommendation) {
      return res.status(400).json({
        message:
          "A recommendation for this meal by this blogger already exists",
        errorCode: ErrorCode.RECOMMENDATION_ALREADY_EXISTS
      })
    }

    // Validate and attach categories
    const validCategories = await Category.find({ _id: { $in: categories } })

    if (validCategories.length !== categories.length) {
      return res.status(404).json({
        message: "One or more categories not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    // Upload images to Google Cloud Storage
    let uploadedImages: string[] = []
    if (files && files.length > 0) {
      uploadedImages = await uploadFilesToGCS(files, "recommendations")
    }

    // Create the recommendation
    const recommendation = new Recommendation({
      blogger: bloggerId,
      quote,
      rating,
      date,
      url,
      mealName,
      mealDescription,
      mealImages: uploadedImages, // Attach uploaded images
      restaurant: restaurantId,
      categories
    })

    await recommendation.save()

    // Attach the recommendation to the restaurant
    restaurant.recommendations.push(
      recommendation._id as mongoose.Types.ObjectId
    )
    await restaurant.save()

    // Attach the recommendation to the categories
    for (const category of validCategories) {
      category.recommendations.push(
        recommendation._id as mongoose.Types.ObjectId
      )
      await category.save()
    }

    // Attach the recommendation to the blogger
    blogger.recommendations.push(recommendation._id as mongoose.Types.ObjectId)
    await blogger.save()

    res.status(201).json({
      message: "Recommendation created successfully",
      data: recommendation
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
