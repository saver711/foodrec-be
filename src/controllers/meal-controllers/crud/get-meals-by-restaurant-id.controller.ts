import { ErrorCode } from "@models/api/error-code.enum"
import Meal from "@models/meal.model"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"
import { SortOrder } from "mongoose"

// Get meals by restaurant ID with sorting
export const getMealsByRestaurantId = async (req: Request, res: Response) => {
  const { restaurantId } = req.params
  const { page = 1, perPage = 10, sortBy, sortOrder } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Check if the restaurant exists
    const restaurantExists = await Restaurant.findById(restaurantId)
    if (!restaurantExists) {
      return res.status(404).json({
        message: "Restaurant not found",
        errorCode: ErrorCode.RESTAURANT_NOT_FOUND
      })
    }

    const pipeline: any[] = [{ $match: { restaurant: restaurantExists._id } }]

    // Sorting logic based on query
    if (sortBy === "likes") {
      pipeline.push({
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          images: 1,
          categories: 1,
          restaurant: 1,
          likedBy: 1,
          recommendations: 1,
          likesCount: { $size: "$likedBy" } // Add likesCount for sorting
        }
      })
      pipeline.push({
        $sort: { likesCount: sortOrder === "asc" ? 1 : -1 }
      })
      pipeline.push({
        $project: { likesCount: 0 } // Exclude likesCount from the final result
      })
    } else if (sortBy === "recommendations") {
      pipeline.push({
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          images: 1,
          categories: 1,
          restaurant: 1,
          likedBy: 1,
          recommendations: 1,
          recommendationsCount: { $size: "$recommendations" } // Add recommendationsCount for sorting
        }
      })
      pipeline.push({
        $sort: { recommendationsCount: sortOrder === "asc" ? 1 : -1 }
      })
      pipeline.push({
        $project: { recommendationsCount: 0 } // Exclude recommendationsCount but keep recommendations
      })
    } else if (sortBy) {
      const sortOptions: { [key: string]: SortOrder } = {}
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1
      pipeline.push({
        $sort: sortOptions
      })
    }

    pipeline.push({ $skip: (pageNumber - 1) * pageSize })
    pipeline.push({ $limit: pageSize })

    const meals = await Meal.aggregate(pipeline)
    const totalMeals = await Meal.countDocuments({
      restaurant: restaurantExists._id
    })

    return res.status(200).json({
      data: meals,
      pagination: {
        total: totalMeals,
        currentPage: pageNumber,
        pageSize: pageSize
      },
      message: "Meals fetched successfully"
    })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch meals",
      error
    })
  }
}
