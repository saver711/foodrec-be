import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import Location from "@models/location.model"
import { SortOrder } from "mongoose"

// Get all recommendations, with optional sorting by nearest location
export const getAllRecommendations = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder,
    lat,
    long,
    populate
  } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Default query for non-nearest sorting
    if (sortBy !== "nearest" || !lat || !long) {
      const sortOptions: { [key: string]: SortOrder } = {}
      sortOptions[sortBy as string] = sortOrder === "asc" ? "asc" : "desc"

      let query = Recommendation.find({})
        .sort(sortOptions)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)

      // Dynamically populate fields if 'populate' query parameter is provided
      if (populate) {
        const fieldsToPopulate = (populate as string).split(",")
        fieldsToPopulate.forEach(field => {
          query = query.populate(field.trim())
        })
      }

      const recommendations = await query.exec()
      const totalRecommendations = await Recommendation.countDocuments()

      return res.status(200).json({
        data: recommendations,
        pagination: {
          total: totalRecommendations,
          currentPage: pageNumber,
          pageSize: pageSize
        },
        message: "Recommendations fetched successfully"
      })
    }

    // If sorting by nearest location, perform geoNear on the locations collection
    const userLocation: [number, number] = [+long, +lat]

    const recommendations = await Location.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: userLocation
          },
          distanceField: "distance",
          spherical: true
        }
      },
      {
        $lookup: {
          from: "restaurants",
          localField: "restaurant",
          foreignField: "_id",
          as: "restaurant"
        }
      },
      { $unwind: "$restaurant" },
      {
        $lookup: {
          from: "meals",
          localField: "restaurant.meals",
          foreignField: "_id",
          as: "meal"
        }
      },
      { $unwind: "$meal" },
      {
        $lookup: {
          from: "recommendations",
          localField: "meal._id",
          foreignField: "meal",
          as: "recommendations"
        }
      },
      { $unwind: "$recommendations" },
      {
        $project: {
          distance: 1,
          _id: "$recommendations._id",
          quote: "$recommendations.quote",
          rating: "$recommendations.rating",
          date: "$recommendations.date",
          url: "$recommendations.url",
          "meal._id": 1,
          "meal.name": 1,
          "meal.description": 1,
          "meal.images": 1,
          "meal.categories": 1,
          "meal.likedBy": 1,
          "restaurant._id": 1,
          "restaurant.name": 1,
          "restaurant.logo": 1
        }
      },
      { $sort: { distance: 1 } },
      { $limit: pageSize },
      { $skip: (pageNumber - 1) * pageSize }
    ])

    return res.status(200).json({
      data: recommendations,
      pagination: {
        total: recommendations.length,
        currentPage: pageNumber,
        pageSize: pageSize
      },
      message: "Recommendations fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch recommendations"
    })
  }
}
