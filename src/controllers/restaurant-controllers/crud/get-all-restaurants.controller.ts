import { Request, Response } from "express"
import Location from "@models/location.model"
import Restaurant from "@models/restaurant.model"

// Get all restaurants with sorting options, including sorting by nearest location
export const getAllRestaurants = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder = "asc", // No default should be added for sortOrder
    lat,
    long,
    populate
  } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Aggregation pipeline for sorting by nearest location
    if (sortBy === "nearest" && lat && long) {
      const userLocation: [number, number] = [+long, +lat] // Explicitly typing as a tuple

      const pipeline: any[] = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: userLocation // Ensure this is of type [number, number]
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
          // Group by restaurant to avoid duplicate entries
          $group: {
            _id: "$restaurant._id",
            name: { $first: "$restaurant.name" },
            logo: { $first: "$restaurant.logo" },
            distance: { $first: "$distance" }, // Keep the nearest distance
            meals: { $first: "$restaurant.meals" }, // Keep meal IDs
            locations: { $first: "$restaurant.locations" } // Keep location IDs
          }
        },
        // Explicit sorting by distance after the geoNear stage
        {
          $sort: {
            distance: sortOrder === "asc" ? 1 : -1 // Apply sortOrder for distance
          }
        },
        { $limit: pageSize },
        { $skip: (pageNumber - 1) * pageSize }
      ]

      // If dynamic population is requested
      if (populate) {
        const fieldsToPopulate = (populate as string).split(",")
        fieldsToPopulate.forEach(field => {
          pipeline.push({
            $lookup: {
              from: field,
              localField: field === "meals" ? "meals" : "locations",
              foreignField: "_id",
              as: field
            }
          })
        })
      }

      const restaurants = await Location.aggregate(pipeline)

      const totalRestaurants = await Location.countDocuments()

      return res.status(200).json({
        data: restaurants,
        pagination: {
          total: totalRestaurants,
          currentPage: pageNumber,
          pageSize: pageSize
        },
        message: "Restaurants fetched successfully"
      })
    } else {
      // Aggregation pipeline for sorting by meals count or recommendations
      const pipeline: any[] = []

      if (sortBy === "meals") {
        pipeline.push({
          $project: {
            mealsCount: { $size: "$meals" },
            name: 1,
            logo: 1,
            meals: 1,
            locations: 1
          }
        })
        pipeline.push({
          $sort: { mealsCount: sortOrder === "asc" ? 1 : -1 }
        })
      } else if (sortBy === "recommendations") {
        pipeline.push({
          $lookup: {
            from: "meals",
            localField: "meals",
            foreignField: "_id",
            as: "meals"
          }
        })
        pipeline.push({
          $lookup: {
            from: "recommendations",
            localField: "meals._id",
            foreignField: "meal",
            as: "recommendations"
          }
        })
        pipeline.push({
          $project: {
            recommendationsCount: { $size: "$recommendations" },
            name: 1,
            logo: 1,
            meals: 1,
            locations: 1
          }
        })
        pipeline.push({
          $sort: { recommendationsCount: sortOrder === "asc" ? 1 : -1 }
        })
      } else {
        const sortOptions: { [key: string]: 1 | -1 } = {}
        sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1
        pipeline.push({
          $sort: sortOptions
        })
      }

      pipeline.push({ $skip: (pageNumber - 1) * pageSize })
      pipeline.push({ $limit: pageSize })

      if (populate) {
        const fieldsToPopulate = (populate as string).split(",")
        fieldsToPopulate.forEach(field => {
          pipeline.push({
            $lookup: {
              from: field,
              localField: field === "meals" ? "meals" : "locations",
              foreignField: "_id",
              as: field
            }
          })
        })
      }

      const restaurants = await Restaurant.aggregate(pipeline)
      const totalRestaurants = await Restaurant.countDocuments()

      return res.status(200).json({
        data: restaurants,
        pagination: {
          total: totalRestaurants,
          currentPage: pageNumber,
          pageSize: pageSize
        },
        message: "Restaurants fetched successfully"
      })
    }
  } catch (error) {
    res.status(500).json({
      message: "Error fetching restaurants",
      error
    })
  }
}
