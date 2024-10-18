import { ErrorCode } from "@models/api/error-code.enum"
import Location from "@models/location.model"
import Restaurant from "@models/restaurant.model"
import { uploadFileToGCS } from "@utils/gcs.util"
import { Request, Response } from "express"

// Type for location data
interface LocationData {
  name: string
  address: string
  coordinates: { type: string; coordinates: number[] }
  googleMapLink: string
}

// Add a restaurant
export const createRestaurant = async (req: Request, res: Response) => {
  const { name, locations } = req.body

  const existingRestaurant = await Restaurant.findOne({ name })
  if (existingRestaurant) {
    return res.status(400).json({
      message: "Restaurant with this name already exists",
      errorCode: ErrorCode.RESTAURANT_ALREADY_EXISTS
    })
  }

  // Validate if locations exist
  if (!locations || locations.length === 0) {
    return res.status(400).json({
      message: "At least one location is required to create a restaurant",
      errorCode: ErrorCode.AT_LEAST_ONE_LOCATION_REQUIRED
    })
  }

  try {
    // If image is uploaded
    let imageUrl = ""
    const imageFile = req.file
    if (imageFile) {
      imageUrl = await uploadFileToGCS(imageFile, "restaurants") // Specify folder
    }

    // Create restaurant
    const restaurant = new Restaurant({ name, logo: imageUrl })
    await restaurant.save()

    // Attach locations to the restaurant
    const locationPromises = locations.map((locationData: LocationData) => {
      const location = new Location({
        ...locationData,
        restaurant: restaurant._id
      })
      return location.save()
    })
    const savedLocations = await Promise.all(locationPromises)

    // Update restaurant with saved locations
    restaurant.locations = savedLocations.map(location => location._id)
    await restaurant.save()

    res.status(201).json({
      message: "Restaurant added successfully",
      data: restaurant
    })
  } catch (error) {
    res.status(500).json({
      message: "Failed to add restaurant",
      error
    })
  }
}
