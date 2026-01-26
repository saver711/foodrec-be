import { ErrorCode } from "@models/api/error-code.enum"
import Location from "@models/location.model"
import { ILocation } from "@models/location.model"
import Restaurant from "@models/restaurant.model"
import { uploadFileToS3 } from "@utils/s3.util"
import { Request, Response } from "express"

// Type for location data

// Add a restaurant
export const createRestaurant = async (req: Request, res: Response) => {
  const { name, locations } = req.body
  const file = req.file

  // Validate name
  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Restaurant name is required",
      errorCode: ErrorCode.NAME_IS_REQUIRED
    })
  }

  // Validate locations
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return res.status(400).json({
      message: "At least one location is required to create a restaurant",
      errorCode: ErrorCode.AT_LEAST_ONE_LOCATION_REQUIRED
    })
  }

  try {
    // Check for existing restaurant
    const existingRestaurant = await Restaurant.findOne({ name })
    if (existingRestaurant) {
      return res.status(400).json({
        message: "Restaurant with this name already exists",
        errorCode: ErrorCode.RESTAURANT_ALREADY_EXISTS
      })
    }

    // Upload logo if provided
    let logoUrl = ""
    if (file) {
      logoUrl = await uploadFileToS3(file, "restaurants")
    }

    // Create restaurant
    const restaurant = new Restaurant({
      name,
      logo: logoUrl,
    })
    await restaurant.save()

    // Save locations and link to restaurant
    const locationDocs = await Promise.all(
      locations.map((loc: any) => {
        const location = new Location({ ...loc, restaurant: restaurant._id })
        return location.save()
      })
    )
    restaurant.locations = locationDocs.map(loc => loc._id)
    await restaurant.save()

    return res.status(201).json({
      message: "Restaurant created successfully",
      data: restaurant
    })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create restaurant",
      error
    })
  }
}

