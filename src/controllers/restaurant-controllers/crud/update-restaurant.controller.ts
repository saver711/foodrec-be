import { ErrorCode } from "@models/api/error-code.enum"
import Restaurant from "@models/restaurant.model"
import Location from "@models/location.model"
import Meal from "@models/meal.model"
import { deleteFileFromGCS, uploadFileToGCS } from "@utils/gcs.util" // Import the GCS utility functions
import { Request, Response } from "express"
import mongoose from "mongoose"
import path from "path"

// Update a restaurant by ID
export const updateRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, meals, locations } = req.body // Assuming locations is a structured object
  const file = req.file // Assume logo is passed as a file (Multer)

  try {
    // Find the restaurant by ID
    const restaurant = await Restaurant.findById(id)
    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    // Delete old locations
    if (restaurant.locations.length > 0) {
      await Location.deleteMany({ _id: { $in: restaurant.locations } })
    }

    // Create new locations
    const locationPromises = locations.map((locationData: any) => {
      const location = new Location({
        ...locationData,
        restaurant: restaurant._id
      })
      return location.save()
    })
    const savedLocations = await Promise.all(locationPromises)

    // Check if any meal belongs to a different restaurant
    if (meals && meals.length > 0) {
      const conflictingMeals = await Meal.find({
        _id: { $in: meals },
        restaurant: { $ne: restaurant._id } // Check if the restaurant ID doesn't match
      })
      console.log(`🚀 ~ updateRestaurant ~ conflictingMeals:`, conflictingMeals)

      if (conflictingMeals.length > 0) {
        return res.status(400).json({
          message: "One or many meals belong to another restaurant",
          errorCode: ErrorCode.ONE_OR_MANY_MEAL_BELONG_TO_ANOTHER_RESTAURANT,
          conflictingMeals: conflictingMeals.map(meal => meal.name) // Return conflicting meals
        })
      }

      // Update the restaurant reference in the meals
      await Meal.updateMany(
        { _id: { $in: meals } }, // Find meals by their IDs
        { $set: { restaurant: restaurant._id } } // Update the restaurant reference
      )
    }
    // Upload new logo if provided
    let logoUrl = restaurant.logo
    if (file) {
      if (restaurant.logo) {
        // Extract the filename from the current logo URL
        const oldLogoFileName = path.basename(restaurant.logo)
        // Delete the old logo from GCS
        await deleteFileFromGCS(`restaurants/${oldLogoFileName}`)
      }

      // Upload the new logo to GCS
      logoUrl = await uploadFileToGCS(file, "restaurants")
    }

    // Update the restaurant fields
    restaurant.name = name
    restaurant.logo = logoUrl
    restaurant.locations = savedLocations.map(
      location => location._id as mongoose.Types.ObjectId
    )

    // Save the updated restaurant
    await restaurant.save()

    res.status(200).json({
      message: "Restaurant updated successfully",
      data: restaurant
    })
  } catch (error) {
    res.status(500).json({
      message: "Error updating restaurant",
      error
    })
  }
}
