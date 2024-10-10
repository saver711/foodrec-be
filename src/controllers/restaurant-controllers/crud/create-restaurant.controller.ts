import Location from "@models/location.model"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"
// Add a restaurant
export const createRestaurant = async (req: Request, res: Response) => {
  const { name, locations, logo } = req.body

  try {
    const restaurant = new Restaurant({ name, logo })
    console.log(`🚀 ~ createRestaurant ~ restaurant:`, restaurant)
    await restaurant.save()

    // Attach locations to the restaurant
    const locationPromises = locations.map((locationData: any) => {
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

    res
      .status(201)
      .json({ message: "Restaurant added successfully", data: restaurant })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
