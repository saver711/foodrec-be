import { Request, Response } from "express"
import Restaurant from "@models/restaurant.model"

// Add a restaurant
export const createRestaurant = async (req: Request, res: Response) => {
  const { name, locations, logo, meals } = req.body

  try {
    const restaurant = new Restaurant({ name, locations, logo, meals })
    await restaurant.save()
    res
      .status(201)
      .json({ message: "Restaurant added successfully", data: restaurant })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
