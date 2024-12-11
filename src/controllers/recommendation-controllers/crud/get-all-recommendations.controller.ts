import Location from "@models/location.model"
import Recommendation, { IRecommendation } from "@models/recommendation.model"
import { Request, Response } from "express"
import { Document, ObjectId, SortOrder } from "mongoose"

// Get all recommendations, with optional sorting by nearest location
export const getAllRecommendations = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder,
    // -----------------------
    lat,
    long,
    populate,
    _id, // ID filter
    mealName, // Partial match for meal name
    rating, // Exact match for rating
    restaurantIds, // Array of restaurant IDs
    bloggerIds, // Array of blogger IDs
    categoryIds // Array of category IDs
  } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Building the query filter
    const filter: { [key: string]: any } = {}

    if (_id) filter._id = _id
    if (mealName) filter.mealName = { $regex: mealName, $options: "i" }
    if (rating) filter.rating = +rating
    if (restaurantIds)
      filter.restaurant = {
        $in: (restaurantIds as string).split(",").map(id => id.trim())
      }
    if (bloggerIds)
      filter.blogger = {
        $in: (bloggerIds as string).split(",").map(id => id.trim())
      }
    if (categoryIds)
      filter.categories = {
        $in: (categoryIds as string).split(",").map(id => id.trim())
      }

    // Default query for non-nearest sorting
    if (sortBy !== "nearest" || !lat || !long) {
      const sortOptions: { [key: string]: SortOrder } = {}
      sortOptions[sortBy as string] = sortOrder === "asc" ? "asc" : "desc"

      let query = Recommendation.find(filter)
        .sort(sortOptions)
        .skip((pageNumber - 1) * pageSize) // Adjusted for one-indexed pagination
        .limit(pageSize)

      // Dynamically populate fields if 'populate' query parameter is provided
      if (populate) {
        const fieldsToPopulate = (populate as string).split(",")
        fieldsToPopulate.forEach(field => {
          query = query.populate(field.trim()) as unknown as typeof query
        })
      }

      const recommendations = await query.exec()
      const totalRecommendations = await Recommendation.countDocuments(filter)
      const totalPages = Math.ceil(totalRecommendations / pageSize)

      return res.status(200).json({
        data: recommendations,
        pagination: {
          totalElements: totalRecommendations,
          pages: totalPages,
          currentPage: pageNumber,
          pageSize: pageSize
        },
        message: "Recommendations fetched successfully"
      })
    }

    // If sorting by nearest location, perform geoNear on the locations collection
    const userLocation: [number, number] = [+long, +lat]

    const recommendations = (await Location.aggregate([
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
          from: "recommendations",
          let: { restaurantId: "$restaurant._id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$restaurant", "$$restaurantId"] } } },
            { $match: filter } // Apply filters to recommendations
          ],
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
          mealName: "$recommendations.mealName",
          mealDescription: "$recommendations.mealDescription",
          mealImages: "$recommendations.mealImages",
          "restaurant._id": 1,
          "restaurant.name": 1,
          "restaurant.logo": 1
        }
      },
      { $sort: { distance: 1 } },
      { $skip: (pageNumber - 1) * pageSize }, // Adjusted for one-indexed pagination
      { $limit: pageSize }
    ])) as (Document<unknown, {}, IRecommendation> &
      IRecommendation & { _id: ObjectId })[]

    const totalRecommendations = recommendations.length
    const totalPages = Math.ceil(totalRecommendations / pageSize)

    return res.status(200).json({
      data: recommendations,
      pagination: {
        totalElements: totalRecommendations,
        pages: totalPages,
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
