import Blogger from "@models/blogger.model"
import { Request, Response } from "express"
import { SortOrder } from "mongoose" // Import SortOrder type

export const getAllBloggers = async (req: Request, res: Response) => {
  const { page = 1, perPage = 10, sortBy, sortOrder, populate } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    // Construct the pipeline for aggregation
    const pipeline: any[] = []

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
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1
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

    const totalBloggers = await Blogger.countDocuments()

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
