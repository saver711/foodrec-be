import { Request, Response } from "express"
import Restaurant from "@models/restaurant.model"

// Delete a restaurant by ID
export const deleteRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(id)
    if (!deletedRestaurant)
      return res.status(404).json({ message: "Restaurant not found" })

    res.status(200).json({ message: "Restaurant deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting restaurant", error })
  }
}
