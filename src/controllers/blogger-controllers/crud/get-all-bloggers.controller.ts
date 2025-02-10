import Blogger from "@models/blogger.model"
import { Request, Response } from "express"
import { SortOrder } from "mongoose" // Import SortOrder type
let showErr = 1
export const getAllBloggers = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy,
    sortOrder = "asc",
    populate,
    name,
    recommendationsIds
  } = req.query // Default page to 0

  try {
    // if (showErr < 3) {
    //   showErr++
    //   return res.status(400).json({
    //     errorCode: ErrorCode.ACCESS_DENIED,
    //     message: "Failed to fetch bloggers"
    //   })
    // }
    const pageNumber = +page
    const pageSize = +perPage

    // Construct the pipeline for aggregation
    const pipeline: any[] = []

    // Filtering logic
    const matchStage: any = {}
    if (name) {
      matchStage.name = { $regex: new RegExp(name as string, "i") } // Case-insensitive name search
    }
    if (recommendationsIds) {
      const ids = Array.isArray(recommendationsIds)
        ? recommendationsIds
        : [recommendationsIds]
      matchStage.recommendations = { $in: ids }
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    // Sorting logic based on the field
    if (sortBy === "recommendations") {
      pipeline.push({
        $project: {
          name: 1,
          bio: 1,
          image: 1,
          socialLinks: 1,
          recommendations: 1,
          followers: 1,
          recommendationsCount: { $size: "$recommendations" }
        }
      })
      pipeline.push({
        $sort: { recommendationsCount: sortOrder === "asc" ? 1 : -1 }
      })
    } else if (sortBy === "followers") {
      pipeline.push({
        $project: {
          name: 1,
          bio: 1,
          image: 1,
          socialLinks: 1,
          recommendations: 1,
          followers: 1,
          followersCount: { $size: "$followers" }
        }
      })
      pipeline.push({
        $sort: { followersCount: sortOrder === "asc" ? 1 : -1 }
      })
    } else {
      const sortOptions: { [key: string]: SortOrder } = {}
      if (sortBy) {
        sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1
      } else {
        sortOptions["_id"] = 1 // Default sort by insertion order
      }
      pipeline.push({
        $sort: sortOptions
      })
    }

    // Remove the temporary count fields after sorting
    pipeline.push({
      $project: {
        recommendationsCount: 0,
        followersCount: 0
      }
    })

    // Pagination
    pipeline.push({
      $skip: (pageNumber - 1) * pageSize
    })
    pipeline.push({
      $limit: pageSize
    })

    // Add dynamic population if requested
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        pipeline.push({
          $lookup: {
            from: field,
            localField: field,
            foreignField: "_id",
            as: field
          }
        })
      })
    }

    const bloggers = await Blogger.aggregate(pipeline)

    const totalBloggers = await Blogger.countDocuments(matchStage) // Use matchStage for total count

    res.status(200).json({
      data: bloggers,
      pagination: {
        total: totalBloggers,
        currentPage: pageNumber,
        pageSize: pageSize
      },
      message: "Bloggers fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch bloggers"
    })
  }
}
