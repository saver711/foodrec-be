import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import Category from "@models/category.model"
import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
import Restaurant from "@models/restaurant.model"
import { uploadFilesToGCS } from "@utils/gcs.util"
import { Request, Response } from "express"
import mongoose from "mongoose"

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
    categories,
    locations
  } = req.body
  const files = req.files as Express.Multer.File[]

  try {
    // Check for existence of blogger and restaurant
    if (!locations)
      return res.status(404).json({
        message: "Specify locations criteria",
        errorCode: ErrorCode.LOCATIONS_REQUIRED
      })
    const blogger = await Blogger.findById(bloggerId)
    if (!blogger)
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })

    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant)
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })

    // Ensure unique recommendation for the same blogger and meal
    const existingRecommendation = await Recommendation.findOne({
      restaurant: restaurantId,
      blogger: bloggerId,
      mealName
    })
    if (existingRecommendation)
      return res.status(400).json({
        message:
          "A recommendation for this meal by this blogger already exists",
        errorCode: ErrorCode.RECOMMENDATION_ALREADY_EXISTS
      })

    // Validate categories
    const validCategories = await Category.find({ _id: { $in: categories } })
    if (validCategories.length !== categories.length)
      return res.status(404).json({
        message: "One or more categories not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })

    // Upload images to GCS
    const uploadedImages = files?.length
      ? await uploadFilesToGCS(files, "recommendations")
      : []

    // Create the recommendation
    const recommendation = new Recommendation({
      blogger: bloggerId,
      quote,
      rating,
      date,
      url,
      mealName,
      mealDescription,
      mealImages: uploadedImages,
      restaurant: restaurantId,
      categories
    })

    await recommendation.save()

    // Update restaurant, blogger, and categories
    restaurant.recommendations.push(recommendation._id)
    await restaurant.save()

    validCategories.forEach(async category => {
      category.recommendations.push(recommendation._id)
      await category.save()
    })

    blogger.recommendations.push(recommendation._id)
    await blogger.save()

    // Handle locations
    if (locations === "ALL_LOCATIONS") {
      // Update all restaurant's locations with this recommendation
      await Location.updateMany(
        { restaurant: restaurantId },
        { $push: { recommendations: recommendation._id } }
      )
    } else {
      // Update specific locations
      const selectedLocations = Array.isArray(locations)
        ? locations.map((loc: string) => new mongoose.Types.ObjectId(loc))
        : []
      await Location.updateMany(
        { _id: { $in: selectedLocations } },
        { $push: { recommendations: recommendation._id } }
      )
    }

    res.status(201).json({
      message: "Recommendation created successfully",
      data: recommendation
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
