import { Request, Response } from "express"
import Meal from "@models/meal.model"
import { SortOrder } from "mongoose"

export const getAllMeals = async (req: Request, res: Response) => {
  const { page = 1, perPage = 10, sortBy, sortOrder, populate } = req.query

  try {
    const pageNumber = +page
    const pageSize = +perPage

    const sortOptions: { [key: string]: SortOrder } = {}
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1

    let query = Meal.find({})
      .sort(sortOptions)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)

    // Dynamic population
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",")
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim())
      })
    }

    const meals = await query.exec()
    const totalMeals = await Meal.countDocuments()

    res.status(200).json({
      data: meals,
      pagination: {
        total: totalMeals,
        currentPage: pageNumber,
        pageSize: pageSize
      },
      message: "Meals fetched successfully"
    })
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch meals", error })
  }
}
