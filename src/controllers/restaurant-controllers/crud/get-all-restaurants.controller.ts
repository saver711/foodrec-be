import Location from "@models/location.model"
import Restaurant from "@models/restaurant.model"
import { Request, Response } from "express"

// Get all restaurants with sorting options, including sorting by nearest location
export const getAllRestaurants = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder = "asc", // No default should be added for sortOrder
    lat,
    long,
    populate,
    name, // Add name filter
    _id // Add _id filter
  } = req.query as {
    page?: number
    perPage?: number
    sortBy?: string
    sortOrder?: string
    lat?: number
    long?: number
    populate?: string
    name?: string
    _id?: string
  }

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Build filter object
    const filter: { [key: string]: any } = {}
    // For partial _id search, we will match on a stringified _id in the pipeline
    let idRegex = undefined
    if (_id) idRegex = { $regex: _id, $options: "i" }
    if (name) filter.name = { $regex: name, $options: "i" } // Partial, case-insensitive match

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
        // Convert _id to string for regex search
        (idRegex ? { $addFields: { _idStr: { $toString: "$_id" } } } : undefined),
        // Inject filter after geoNear
        Object.keys(filter).length || idRegex ? { $match: { ...filter, ...(idRegex ? { _idStr: idRegex } : {}) } } : undefined,
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
            recommendations: { $first: "$restaurant.recommendations" }, // Keep recommendation IDs
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
              localField:
                field === "recommendations" ? "recommendations" : "locations",
              foreignField: "_id",
              as: field
            }
          })
        })
      }

      // Remove undefined stages (if filter is empty)
      const filteredPipeline = pipeline.filter(Boolean)
      const restaurants = await Location.aggregate(filteredPipeline)

      const totalRestaurants = restaurants.length

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
      // Aggregation pipeline for sorting by recommendations count or recommendations
      const pipeline: any[] = []

      // Convert _id to string for regex search
      if (idRegex) {
        pipeline.push({ $addFields: { _idStr: { $toString: "$_id" } } })
      }
      // Add filter at the beginning if present
      if (Object.keys(filter).length || idRegex) {
        pipeline.push({ $match: { ...filter, ...(idRegex ? { _idStr: idRegex } : {}) } })
      }

      if (sortBy === "recommendations") {
        pipeline.push({
          $project: {
            recommendationsCount: { $size: "$recommendations" },
            name: 1,
            logo: 1,
            recommendations: 1,
            locations: 1
          }
        })
        pipeline.push({
          $sort: { recommendationsCount: sortOrder === "asc" ? 1 : -1 }
        })
      } else if (sortBy === "recommendations") {
        pipeline.push({
          $lookup: {
            from: "recommendations",
            localField: "recommendations",
            foreignField: "_id",
            as: "recommendations"
          }
        })
        pipeline.push({
          $lookup: {
            from: "recommendations",
            localField: "recommendations._id",
            foreignField: "recommendation",
            as: "recommendations"
          }
        })
        pipeline.push({
          $project: {
            recommendationsCount: { $size: "$recommendations" },
            name: 1,
            logo: 1,
            recommendations: 1,
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
              localField:
                field === "recommendations" ? "recommendations" : "locations",
              foreignField: "_id",
              as: field
            }
          })
        })
      }

      const restaurants = await Restaurant.aggregate(pipeline)
      // Count only documents matching the filter
      const totalRestaurants = await Restaurant.countDocuments(filter)

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
