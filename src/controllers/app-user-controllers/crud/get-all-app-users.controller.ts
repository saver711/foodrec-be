import { Request, Response } from "express"
import AppUser from "@models/app-user.model"

// Get all app users
export const getAllAppUsers = async (req: Request, res: Response) => {
  try {
    const users = await AppUser.find().populate("favMeals following")
    res.status(200).json({ data: users })
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error })
  }
}
