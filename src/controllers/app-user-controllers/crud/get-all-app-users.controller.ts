import { Request, Response } from "express"
import AppUser from "@models/app-user.model"

// Get all app users with pagination
export const getAllAppUsers = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy = "name",
    sortOrder = "asc",
    name,
    email,
    phone
  } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Build filter
    const filter: { [key: string]: any } = {}
    if (name) {
      filter.name = { $regex: name, $options: "i" }
    }
    if (email) {
      filter.email = { $regex: email, $options: "i" }
    }
    if (phone) {
      filter.phone = { $regex: phone, $options: "i" }
    }

    // Build sort options
    const sortOptions: { [key: string]: 1 | -1 } = {}
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1

    // Execute query with pagination
    const users = await AppUser.find(filter)
      .sort(sortOptions)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate("following")

    const totalUsers = await AppUser.countDocuments(filter)

    res.status(200).json({
      data: users,
      pagination: {
        total: totalUsers,
        currentPage: pageNumber,
        pageSize: pageSize
      },
      message: "App users fetched successfully"
    })
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error })
  }
}
