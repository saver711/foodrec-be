import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import Recommendation from "@models/recommendation.model"
import { NextFunction, Request, Response } from "express"

export const getFavorites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params
  const {
    page = 1,
    perPage = 10,
    sortBy = "date",
    sortOrder = "desc",
    populate
  } = req.query as {
    page?: number
    perPage?: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
    populate?: string
  }

  try {
    // Verify user can only view their own favorites
    if (req.user?.userId !== userId) {
      return res.status(403).json({
        message: "You can only view your own favorites",
        errorCode: ErrorCode.FORBIDDEN
      })
    }

    // Check if user exists
    const user = await AppUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    const pageNumber = +page
    const pageSize = +perPage
    const skip = (pageNumber - 1) * pageSize

    // Build query for recommendations
    const recommendationIds = user.favorites.map(id => id.toString())
    
    if (recommendationIds.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          total: 0,
          currentPage: pageNumber,
          pageSize
        },
        message: "No favorites found"
      })
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    // Build populate options
    const populateOptions: string[] = populate ? populate.split(",") : []

    // Query recommendations
    let query = Recommendation.find({ _id: { $in: recommendationIds } })
      .sort(sort)
      .skip(skip)
      .limit(pageSize)

    // Apply population
    if (populateOptions.includes("blogger")) {
      query = query.populate("blogger") as any
    }
    if (populateOptions.includes("restaurant")) {
      query = query.populate("restaurant") as any
    }
    if (populateOptions.includes("categories")) {
      query = query.populate("categories") as any
    }
    if (populateOptions.includes("locations")) {
      query = query.populate("locations") as any
    }

    const recommendations = await query.exec() as any
    const total = recommendationIds.length

    return res.status(200).json({
      data: recommendations,
      pagination: {
        total,
        currentPage: pageNumber,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      message: "Favorites fetched successfully"
    })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch favorites",
      error
    })
  }
}
