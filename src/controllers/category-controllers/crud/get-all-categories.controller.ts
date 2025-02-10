import { Request, Response } from "express"
import Category from "@models/category.model"
import { SortOrder } from "mongoose"

// Get all categories, with sorting by number of recommendations
export const getAllCategories = async (req: Request, res: Response) => {
  const { page = 1, perPage = 10, sortBy = "name", sortOrder, name } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    const pipeline: any[] = []

    if (name) {
      pipeline.push({
        $match: { name: { $regex: name, $options: "i" } }
      })
    }

    if (sortBy === "recommendations") {
      pipeline.push({
        $project: {
          recommendationsCount: { $size: "$recommendations" },
          name: 1,
          recommendations: 1
        }
      })
      pipeline.push({
        $sort: { recommendationsCount: sortOrder === "asc" ? 1 : -1 }
      })
    } else {
      const sortOptions: { [key: string]: SortOrder } = {}
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1
      pipeline.push({
        $sort: sortOptions
      })
    }

    pipeline.push({ $skip: (pageNumber - 1) * pageSize })
    pipeline.push({ $limit: pageSize })

    const categories = await Category.aggregate(pipeline)

    const totalCategories = await Category.countDocuments(
      name ? { name: { $regex: name, $options: "i" } } : {}
    )

    res.status(200).json({
      data: categories,
      pagination: {
        total: totalCategories,
        currentPage: pageNumber,
        pageSize: pageSize
      },
      message: "Categories fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch categories"
    })
  }
}
