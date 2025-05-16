import { ErrorCode } from "@models/api/error-code.enum"
import Restaurant from "@models/restaurant.model"
import Location from "@models/location.model"
import Recommendation from "@models/recommendation.model"
import { deleteFileFromGCS, uploadFileToGCS } from "@utils/gcs.util" // Import the GCS utility functions
import { Request, Response } from "express"
import mongoose from "mongoose"
import path from "path"

// Update a restaurant by ID
export const updateRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, recommendations, locations } = req.body
  const file = req.file

  // Validate name
  if (name && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({
      message: "Restaurant name must be a non-empty string",
      errorCode: ErrorCode.NAME_IS_REQUIRED
    })
  }

  // Validate locations if provided
  if (locations && (!Array.isArray(locations) || locations.length === 0)) {
    return res.status(400).json({
      message: "At least one location is required",
      errorCode: ErrorCode.AT_LEAST_ONE_LOCATION_REQUIRED
    })
  }

  try {
    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    // Update name if provided
    if (name) restaurant.name = name

    // Handle locations update if provided
    if (locations) {
      // Delete old locations
      if (restaurant.locations.length > 0) {
        await Location.deleteMany({ _id: { $in: restaurant.locations } })
      }
      // Create new locations
      const locationDocs = await Promise.all(
        locations.map((loc: any) => {
          const location = new Location({ ...loc, restaurant: restaurant._id })
          return location.save()
        })
      )
      restaurant.locations = locationDocs.map(loc => loc._id)
    }

    // Check if any recommendation belongs to a different restaurant
    if (recommendations && recommendations.length > 0) {
      const conflictingRecommendations = await Recommendation.find({
        _id: { $in: recommendations },
        restaurant: { $ne: restaurant._id } // Check if the restaurant ID doesn't match
      })
      console.log(
        `🚀 ~ updateRestaurant ~ conflictingRecommendations:`,
        conflictingRecommendations
      )

      if (conflictingRecommendations.length > 0) {
        return res.status(400).json({
          message: "One or many recommendations belong to another restaurant",
          errorCode:
            ErrorCode.ONE_OR_MANY_RECOMMENDATION_BELONG_TO_ANOTHER_RESTAURANT,
          conflictingRecommendations: conflictingRecommendations.map(
            recommendation => recommendation.mealName
          ) // Return conflicting recommendations
        })
      }

      // Update the restaurant reference in the recommendations
      await Recommendation.updateMany(
        { _id: { $in: recommendations } }, // Find recommendations by their IDs
        { $set: { restaurant: restaurant._id } } // Update the restaurant reference
      )
    }
    // Upload new logo if provided
    let logoUrl = restaurant.logo
    if (file) {
      if (restaurant.logo) {
        // Extract the filename from the current logo URL
      }
      // Upload new logo
      const logoUrl = await uploadFileToGCS(file, "restaurants")
      restaurant.logo = logoUrl
    }

    await restaurant.save()

    return res.status(200).json({
      message: "Restaurant updated successfully",
      data: restaurant
    })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update restaurant",
      error
    })
  }
}
