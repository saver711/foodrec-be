import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import Meal from "@models/meal.model"
import Blogger from "@models/blogger.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Update a recommendation by ID
export const updateRecommendation = async (req: Request, res: Response) => {
  const { recommendationId } = req.params
  const { mealId, bloggerId, quote, rating, date, url } = req.body

  try {
    // Find the recommendation
    const recommendation = await Recommendation.findById(recommendationId)
    if (!recommendation) {
      return res.status(404).json({
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND,
        message: "Recommendation not found"
      })
    }

    // Check if the meal is being updated, and validate the new meal
    if (mealId && mealId !== recommendation.meal.toString()) {
      const meal = await Meal.findById(mealId)
      if (!meal) {
        return res.status(404).json({
          errorCode: ErrorCode.MEAL_NOT_FOUND,
          message: "Meal not found"
        })
      }
      recommendation.meal = mealId
    }

    // Check if the blogger is being updated, and validate the new blogger
    if (bloggerId && bloggerId !== recommendation.blogger.toString()) {
      const blogger = await Blogger.findById(bloggerId)
      if (!blogger) {
        return res.status(404).json({
          errorCode: ErrorCode.BLOGGER_NOT_FOUND,
          message: "Blogger not found"
        })
      }
      recommendation.blogger = bloggerId
    }

    // Update other fields
    if (quote) recommendation.quote = quote
    if (rating !== undefined) recommendation.rating = rating
    if (date) recommendation.date = date
    if (url) recommendation.url = url

    await recommendation.save()

    res.status(200).json({
      data: recommendation,
      message: "Recommendation updated successfully"
    })
  } catch (error) {
    res.status(500).json({
      error,
      message: "Failed to update recommendation"
    })
  }
}
