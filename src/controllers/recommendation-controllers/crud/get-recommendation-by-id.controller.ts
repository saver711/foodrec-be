import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Fetch a recommendation by ID and dynamically populate fields
export const getRecommendationById = async (req: Request, res: Response) => {
  const { id } = req.params
  const { populate } = req.query // Extract the fields to populate from query parameters

  try {
    let query = Recommendation.findById(id)

    // If 'populate' fields are provided, dynamically populate them
    if (populate) {
      const fieldsToPopulate = (populate as string).split(",") // Split the fields by comma
      fieldsToPopulate.forEach(field => {
        query = query.populate(field.trim()) // Dynamically apply population for each field
      })
    }

    const recommendation = await query.exec()

    if (!recommendation) {
      return res.status(404).json({
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND,
        message: "Recommendation not found"
      })
    }

    res.status(200).json({
      data: recommendation,
      message: "Recommendation fetched successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to fetch recommendation"
    })
  }
}
