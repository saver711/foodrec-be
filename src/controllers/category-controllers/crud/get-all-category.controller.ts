import { Request, Response } from "express"
import Category from "@models/category.model"
import { SortOrder } from "mongoose"

// Get all categories, with sorting by number of meals
export const getAllCategories = async (req: Request, res: Response) => {
  const {
    page = 1,
    perPage = 10,
    sortBy = "name",
    sortOrder = "asc"
  } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    const pipeline: any[] = []

    if (sortBy === "meals") {
      pipeline.push({
        $project: { mealsCount: { $size: "$meals" }, name: 1, meals: 1 }
      })
      pipeline.push({
        $sort: { mealsCount: sortOrder === "asc" ? 1 : -1 }
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

    const totalCategories = await Category.countDocuments()

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
