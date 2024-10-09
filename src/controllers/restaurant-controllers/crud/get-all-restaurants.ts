import { Request, Response } from "express"
import Restaurant from "@models/restaurant.model"

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.find().populate("meals locations")
    res.status(200).json({ data: restaurants })
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurants", error })
  }
}
