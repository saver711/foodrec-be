import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import Category from "@models/category.model"
import Location from "@models/location.model"
import { LocationsCriteria } from "@models/locations/locations-criteria.enum"
import Recommendation from "@models/recommendation.model"
import Restaurant from "@models/restaurant.model"
import { uploadFilesToS3 } from "@utils/s3.util"
import { Request, Response } from "express"
import mongoose from "mongoose"
import { MAX_RATING, MIN_RATING } from "src/consts/min-max-rating"

export const createRecommendation = async (req: Request, res: Response) => {
  const {
    locationsCriteria,
    locations,
    mealName,
    mealDescription,
    quote,
    url,
    rating,
    date,
    bloggerId,
    categoriesIds,
    restaurantId
  } = req.body
  const files = req.files as Express.Multer.File[]

  try {
    // Validate rating
    const receivedRating = rating?.[0]
    if (
      (receivedRating && receivedRating < MIN_RATING) ||
      receivedRating > MAX_RATING
    ) {
      return res.status(400).json({
        message: `Rating must be between ${MIN_RATING} and ${MAX_RATING}`,
        errorCode: ErrorCode.INVALID_RATING
      })
    }

    // Validate date
    if (!date) {
      return res.status(400).json({
        message: "Date is required",
        errorCode: ErrorCode.INVALID_DATE
      })
    }

    // Validate categories
    if (!categoriesIds) {
      return res.status(404).json({
        message: "Specify Categories",
        errorCode: ErrorCode.CATEGORIES_REQUIRED
      })
    }

    // Validate location criteria
    /* CHANGED: we require 'locationsCriteria' to be provided */
    if (
      !locationsCriteria ||
      (locationsCriteria !== LocationsCriteria.ALL_LOCATIONS &&
        locationsCriteria !== LocationsCriteria.SPECIFIC_LOCATIONS)
    ) {
      return res.status(400).json({
        message: "locationsCriteria is required",
        errorCode: ErrorCode.LOCATIONS_REQUIRED
      })
    }

    // Blogger must exist
    const blogger = await Blogger.findById(bloggerId)
    if (!blogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    // Restaurant must exist
    const restaurant = await Restaurant.findById(restaurantId)
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    // Handle "SPECIFIC_LOCATIONS"
    let locationsValue: mongoose.Types.ObjectId[] = []
    if (locationsCriteria === LocationsCriteria.SPECIFIC_LOCATIONS) {
      if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({
          message: "Must provide a non-empty array of location IDs",
          errorCode: ErrorCode.LOCATIONS_REQUIRED
        })
      }
      const locationIds = locations.map(
        (loc: string) => new mongoose.Types.ObjectId(loc)
      )
      const validLocations = await Location.find({
        _id: { $in: locationIds },
        restaurant: restaurantId
      })

      if (validLocations.length !== locationIds.length) {
        return res.status(404).json({
          message:
            "One or more provided locations not found or don't belong to the specified restaurant",
          errorCode: ErrorCode.INVALID_LOCATIONS
        })
      }
      locationsValue = locationIds
    }

    // Ensure unique recommendation (blogger + meal)
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

    // Validate categories
    const validCategories = await Category.find({ _id: { $in: categoriesIds } })
    if (validCategories.length !== categoriesIds.length) {
      return res.status(404).json({
        message: "One or more categories not found",
        errorCode: ErrorCode.CATEGORY_NOT_FOUND
      })
    }

    // Upload images
    const uploadedImages = files?.length
      ? await uploadFilesToS3(files, "recommendations")
      : []

    // Create recommendation
    /* CHANGED: adding 'locationsCriteria' and the updated 'locations' array */
    const recommendation = new Recommendation({
      blogger: bloggerId,
      quote,
      rating: receivedRating,
      date,
      url,
      mealName,
      mealDescription,
      mealImages: uploadedImages,
      restaurant: restaurantId,
      categories: categoriesIds,
      locationsCriteria,
      locations: locationsValue
    })

    await recommendation.save()

    // Update restaurant
    restaurant.recommendations.push(recommendation._id)
    await restaurant.save()

    // Update categories
    validCategories.forEach(async category => {
      category.recommendations.push(recommendation._id)
      await category.save()
    })

    // Update blogger
    blogger.recommendations.push(recommendation._id)
    await blogger.save()

    // Update locations
    if (locationsCriteria === LocationsCriteria.ALL_LOCATIONS) {
      await Location.updateMany(
        { restaurant: restaurantId },
        { $push: { recommendations: recommendation._id } }
      )
    } else {
      // SPECIFIC_LOCATIONS
      await Location.updateMany(
        { _id: { $in: locationsValue }, restaurant: restaurantId },
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
