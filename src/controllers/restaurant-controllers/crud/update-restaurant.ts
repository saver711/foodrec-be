import { Request, Response } from "express"
import Restaurant from "@models/restaurant.model"

// Update a restaurant by ID
export const updateRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, logo, meals, locations } = req.body

  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { name, logo, meals, locations },
      { new: true }
    )
    if (!updatedRestaurant)
      return res.status(404).json({ message: "Restaurant not found" })

    res.status(200).json({ data: updatedRestaurant })
  } catch (error) {
    res.status(500).json({ message: "Error updating restaurant", error })
  }
}
