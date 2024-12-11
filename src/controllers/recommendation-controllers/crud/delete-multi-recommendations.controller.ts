import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Delete multiple recommendations by IDs
export const deleteMultiRecommendations = async (
  req: Request,
  res: Response
) => {
  const { recommendationIds } = req.body // Expecting an array of recommendation IDs in the request body

  if (!Array.isArray(recommendationIds) || recommendationIds.length === 0) {
    return res.status(400).json({
      errorCode: ErrorCode.DATA_SHOULD_BE_MULTIPLE,
      message: "Invalid or empty recommendationIds provided"
    })
  }

  try {
    // Find all recommendations by IDs
    const recommendations = await Recommendation.find({
      _id: { $in: recommendationIds }
    })

    if (recommendations.length === 0) {
      return res.status(404).json({
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND,
        message: "No recommendations found for the provided IDs"
      })
    }

    // Delete the recommendations
    await Recommendation.deleteMany({
      _id: { $in: recommendationIds }
    })

    res.status(200).json({
      message: "Recommendations deleted successfully",
      deletedCount: recommendations.length
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to delete recommendations"
    })
  }
}
