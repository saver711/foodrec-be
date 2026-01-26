import Location from "@models/location.model"
import { Request, Response } from "express"

const getCollectionName = (field: string): string => {
  if (field === "restaurant") return "restaurants"
  if (field === "recommendations") return "recommendations"
  return field
}

const buildResponse = (locations: any[], totalLocations: number, pageNumber: number, pageSize: number) => {
  return {
    data: locations,
    pagination: {
      total: totalLocations,
      currentPage: pageNumber,
      pageSize,
      totalPages: Math.ceil(totalLocations / pageSize)
    },
    message: "Locations fetched successfully"
  }
}

export const getAllLocations = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder = "asc",
    populate,
    name,
    _id,
    restaurantId
  } = req.query as {
    page?: number
    perPage?: number
    sortBy?: string
    sortOrder?: string
    populate?: string
    name?: string
    _id?: string
    restaurantId?: string
  }

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Build filter object
    const filter: { [key: string]: any } = {}
    const idRegex = _id ? { $regex: _id, $options: "i" } : undefined
    if (name) filter.name = { $regex: name, $options: "i" }
    if (restaurantId) filter.restaurant = restaurantId

    // Use aggregation pipeline if ID regex is needed (for partial ObjectId matching)
    if (idRegex) {
      const pipeline: any[] = [
        { $addFields: { _idStr: { $toString: "$_id" } } },
        { $match: { ...filter, _idStr: idRegex } }
      ]

      // Apply sorting
      if (sortBy) {
        pipeline.push({
          $sort: { [sortBy]: sortOrder === "asc" ? 1 : -1 }
        })
      }

      // Apply pagination
      pipeline.push(
        { $skip: (pageNumber - 1) * pageSize },
        { $limit: pageSize }
      )

      // Apply population using $lookup
      if (populate) {
        populate.split(",").forEach(field => {
          const trimmedField = field.trim()
          const collectionName = getCollectionName(trimmedField)
          pipeline.push({
            $lookup: {
              from: collectionName,
              localField: trimmedField,
              foreignField: "_id",
              as: trimmedField
            }
          })
          // Unwind if single reference (not array)
          if (trimmedField === "restaurant") {
            pipeline.push({ $unwind: { path: `$${trimmedField}`, preserveNullAndEmptyArrays: true } })
          }
        })
      }

      // Remove _idStr field from output
      pipeline.push({ $project: { _idStr: 0 } })

      const [locations, totalLocations] = await Promise.all([
        Location.aggregate(pipeline),
        Location.aggregate([
          { $addFields: { _idStr: { $toString: "$_id" } } },
          { $match: { ...filter, _idStr: idRegex } },
          { $count: "total" }
        ]).then(result => result[0]?.total || 0)
      ])

      return res.status(200).json(buildResponse(locations, totalLocations, pageNumber, pageSize))
    }

    // Standard query approach for non-regex ID filtering
    if (_id) filter._id = _id

    // Build query
    let query = Location.find(filter)

    // Apply sorting
    if (sortBy) {
      query = query.sort({ [sortBy]: sortOrder === "asc" ? "asc" : "desc" })
    }

    // Apply pagination
    query = query.skip((pageNumber - 1) * pageSize).limit(pageSize)

    // Apply population
    if (populate) {
      populate.split(",").forEach(field => {
        query = query.populate(field.trim()) as unknown as typeof query
      })
    }

    // Execute query
    const [locations, totalLocations] = await Promise.all([
      query.exec(),
      Location.countDocuments(filter)
    ])

    res.status(200).json(buildResponse(locations, totalLocations, pageNumber, pageSize))

  } catch (error) {
    console.error("Error fetching locations:", error)
    res.status(500).json({
      message: "Failed to fetch locations",
      error: process.env.NODE_ENV === "development" ? error : undefined
    })
  }
}
