import { ErrorCode } from "@models/api/error-code.enum"
import Category from "@models/category.model"
import Location from "@models/location.model"
import Recommendation, { IRecommendation } from "@models/recommendation.model"
import { Request, Response } from "express"
import { Document, ObjectId, SortOrder } from "mongoose"
import { MAX_RATING, MIN_RATING } from "src/consts/min-max-rating"

// Get all recommendations, with optional sorting by nearest location
export const getAllRecommendations = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder,
    lat,
    long,
    populate,
    _id, // ID filter
    mealName, // Partial match for meal name
    rating, // Rating range in the format min:max
    date, // Date range in the format start:end
    restaurantsIds, // Array of restaurant IDs
    bloggersIds, // Array of blogger IDs
    categories // Array of category IDs
  } = req.query as {
    page?: number
    perPage?: number
    sortBy?: string
    sortOrder?: SortOrder
    lat?: number
    long?: number
    populate?: string
    _id?: string
    mealName?: string
    rating?: string
    date?: string
    restaurantsIds?: string
    bloggersIds?: string
    categories?: string
  }

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Validate and parse rating
    let minRating = MIN_RATING
    let maxRating = MAX_RATING
    if (rating) {
      const [min, max] = rating.split(":").map(Number)
      if (min < MIN_RATING || max > MAX_RATING || min > max) {
        return res.status(400).json({
          errorCode: ErrorCode.INVALID_RATING,
          message: `Invalid rating: rating should be in the format min:max with min >= ${MIN_RATING} and max <= ${MAX_RATING}`
        })
      }
      minRating = min
      maxRating = max
    }

    // Validate and parse date
    let startDate = new Date(0) // Default to epoch start
    let endDate = new Date() // Default to today
    if (date) {
      const [start, end] = date.split(":").map(d => new Date(d))
      if (start > end || end > new Date()) {
        return res.status(400).json({
          errorCode: ErrorCode.INVALID_DATE,
          message: `Invalid date: date should be in the format start:end with start <= end and end <= today`
        })
      }
      startDate = start
      endDate = end
    }

    // Building the query filter
    const filter: { [key: string]: any } = {}

    if (_id) filter._id = _id
    if (mealName) filter.mealName = { $regex: mealName, $options: "i" }
    if (rating) {
      filter.rating = {
        $gte: minRating,
        $lte: maxRating
      }
    }
    if (date) {
      filter.date = {
        $gte: startDate,
        $lte: endDate
      }
    }
    if (restaurantsIds)
      filter.restaurant = {
        $in: restaurantsIds.split(",").map(id => id.trim())
      }
    if (bloggersIds)
      filter.blogger = {
        $in: bloggersIds.split(",").map(id => id.trim())
      }
    if (categories) {
      const foundedCategories = await Category.find({
        name: { $in: categories.split(",").map(name => name.trim()) }
      }).select("_id")
      filter.categories = {
        $in: foundedCategories.map(cat => cat._id)
      }
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
        const fieldsToPopulate = populate.split(",")
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
