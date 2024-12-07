import Location from "@models/location.model"
import { Request, Response } from "express"

export const getAllLocations = async (req: Request, res: Response) => {
  const { page = 1, perPage = 10, minLat, minLng, maxLat, maxLng } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Bounding box coordinates for geospatial filtering
    const boundingBox = [
      [parseFloat(minLng as string), parseFloat(minLat as string)], // Bottom-left corner [lng, lat]
      [parseFloat(maxLng as string), parseFloat(maxLat as string)] // Top-right corner [lng, lat]
    ]
    console.log(`🚀 ~ getAllLocations ~ boundingBox:`, boundingBox)

    // Query with geospatial filtering and pagination
    const locationsQuery = Location.aggregate([
      {
        $match: {
          coordinates: {
            $geoWithin: {
              $box: boundingBox
            }
          }
        }
      },
      {
        $lookup: {
          from: "recommendations",
          localField: "_id",
          foreignField: "locations",
          as: "recommendations"
        }
      },
      {
        $match: {
          "recommendations.0": { $exists: true } // Ensures locations with at least one recommendation
        }
      },
      {
        $project: {
          name: 1,
          address: 1,
          coordinates: 1,
          recommendations: 1
        }
      },
      { $skip: (pageNumber - 1) * pageSize },
      { $limit: pageSize }
    ])

    const locations = await locationsQuery.exec()
    const totalLocations = await Location.countDocuments({
      coordinates: {
        $geoWithin: {
          $box: boundingBox
        }
      }
    })

    res.status(200).json({
      data: locations,
      pagination: {
        total: totalLocations,
        currentPage: pageNumber,
        pageSize
      },
      message: "Locations with recommendations fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch locations with recommendations"
    })
  }
}
