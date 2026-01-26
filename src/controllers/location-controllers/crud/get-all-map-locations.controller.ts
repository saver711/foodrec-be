import Location from "@models/location.model"
import { Request, Response } from "express"

export const getAllMapLocations = async (req: Request, res: Response) => {
  const { 
    page = 1, 
    perPage = 10, 
    minLat, 
    minLng, 
    maxLat, 
    maxLng, 
    populate = "restaurant" 
  } = req.query

  try {
    // Validate bounding box params
    if (!minLat || !minLng || !maxLat || !maxLng) {
      return res.status(400).json({ 
        message: "Missing bounding box parameters (minLat, minLng, maxLat, maxLng)" 
      })
    }

    const pageNumber = +page
    const pageSize = +perPage

    // Create bounding polygon for geospatial query
    const boundingPolygon = {
      type: "Polygon",
      coordinates: [[
        [Number.parseFloat(minLng as string), Number.parseFloat(minLat as string)],
        [Number.parseFloat(maxLng as string), Number.parseFloat(minLat as string)],
        [Number.parseFloat(maxLng as string), Number.parseFloat(maxLat as string)],
        [Number.parseFloat(minLng as string), Number.parseFloat(maxLat as string)],
        [Number.parseFloat(minLng as string), Number.parseFloat(minLat as string)]
      ]]
    }

    // Build query
    const query = {
      coordinates: {
        $geoWithin: {
          $geometry: boundingPolygon
        }
      }
    }

    // Build population options
    const populateOptions = []
    
    if (populate && (populate === "restaurant" || (typeof populate === "string" && populate.includes("restaurant")))) {
      populateOptions.push({
        path: "restaurant",
        select: "name logo" // Select only essential fields
      })
    }

    if (
      populate === "recommendations" ||
      (typeof populate === "string" && populate.includes("recommendations"))
    ) {
      populateOptions.push({
        path: "recommendations",
        select: "quote rating mealName mealImages",
        populate: [
          {
            path: "restaurant",
            select: "name logo"
          },
          {
            path: "blogger",
            select: "name avatar"
          },
          {
            path: "categories",
            select: "name"
          }
        ]
      })
    }

    // Execute query with pagination
    const [locations, totalLocations] = await Promise.all([
      Location.find(query)
        .populate(populateOptions)
        .select("name address googleMapsUrl coordinates restaurant recommendations")
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Location.countDocuments(query)
    ])

    res.status(200).json({
      data: locations,
      pagination: {
        total: totalLocations,
        currentPage: pageNumber,
        pageSize,
        totalPages: Math.ceil(totalLocations / pageSize)
      },
      message: "Map locations fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching map locations:", error)
    res.status(500).json({
      message: "Failed to fetch map locations",
      error: process.env.NODE_ENV === "development" ? error : undefined
    })
  }
}
