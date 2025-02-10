import { Request, Response } from "express"
import Location, { ILocation } from "@models/location.model"
import { SortOrder } from "mongoose"

export const getLocationsByRestaurantId = async (
  req: Request,
  res: Response
) => {
  const { restaurantId } = req.params

  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder,
    name,
    populate
  } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Construct the filter object
    const filter: { [key: string]: any } = { restaurant: restaurantId }

    // Add name filter if provided
    if (name) {
      filter.name = { $regex: name, $options: "i" } // Case-insensitive partial match
    }

    // Construct sort options
    const sortOptions: { [key: string]: SortOrder } = {}
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1

    // Build the query
    let query = Location.find(filter)
      .sort(sortOptions)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)

    // Dynamically populate fields if specified
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim()) as unknown as typeof query
      })
    }

    // Execute query
    const locations = await query.exec()

    // Get total count of locations for pagination
    const totalLocations = await Location.countDocuments(filter)
    const totalPages = Math.ceil(totalLocations / pageSize)

    return res.status(200).json({
      data: locations,
      pagination: {
        totalElements: totalLocations,
        currentPage: pageNumber,
        pages: totalPages,
        pageSize: pageSize
      },
      message: "Locations fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch locations"
    })
  }
}
