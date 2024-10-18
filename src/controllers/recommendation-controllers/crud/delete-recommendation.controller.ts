import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Delete a recommendation by ID
export const deleteRecommendation = async (req: Request, res: Response) => {
  const { recommendationId } = req.params

  try {
    const recommendation = await Recommendation.findById(recommendationId)

    if (!recommendation) {
      return res.status(404).json({
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND,
        message: "Recommendation not found"
      })
    }

    await Recommendation.findByIdAndDelete(recommendationId)

    res.status(200).json({
      message: "Recommendation deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to delete recommendation"
    })
  }
}
