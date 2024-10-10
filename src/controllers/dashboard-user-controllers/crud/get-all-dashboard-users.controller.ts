import { Request, Response } from "express"
import DashboardUser from "@models/dashboard-user.model"

// Get all users (SUPER_ADMIN only)
export const getAllDashboardUsers = async (req: Request, res: Response) => {
  try {
    const users = await DashboardUser.find().select("-password") // Exclude password
    res.status(200).json({ data: users })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}
