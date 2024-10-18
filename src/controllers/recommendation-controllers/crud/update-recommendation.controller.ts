import { ErrorCode } from "@models/api/error-code.enum"
import Blogger from "@models/blogger.model"
import Meal from "@models/meal.model"
import Recommendation from "@models/recommendation.model"
import { Request, Response } from "express"
import mongoose from "mongoose"

// Update a recommendation by ID
export const updateRecommendation = async (req: Request, res: Response) => {
  const { id } = req.params
  const { mealId, bloggerId, quote, rating, date, url } = req.body

  try {
    // Find the recommendation by ID
    const recommendation = await Recommendation.findById(id)
    if (!recommendation) {
      return res.status(404).json({
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND,
        message: "Recommendation not found"
      })
    }

    const oldBloggerId = recommendation.blogger.toString()
    const oldMealId = recommendation.meal.toString()

    // Check for duplicate recommendation with the same blogger and meal combination
    const existingRecommendation = await Recommendation.findOne({
      meal: mealId || recommendation.meal, // Use new or existing meal
      blogger: bloggerId || recommendation.blogger, // Use new or existing blogger
      _id: { $ne: recommendation._id } // Exclude the current recommendation
    })

    if (existingRecommendation) {
      return res.status(400).json({
        message:
          "A recommendation for this meal by this blogger already exists",
        errorCode: ErrorCode.RECOMMENDATION_ALREADY_EXISTS
      })
    }

    // If the meal is being updated, validate the new meal
    if (mealId && mealId !== oldMealId) {
      const meal = await Meal.findById(mealId)
      if (!meal) {
        return res.status(404).json({
          errorCode: ErrorCode.MEAL_NOT_FOUND,
          message: "Meal not found"
        })
      }
      recommendation.meal = mealId
    }

    // If the blogger is being updated, validate the new blogger
    if (bloggerId && bloggerId !== oldBloggerId) {
      const blogger = await Blogger.findById(bloggerId)
      if (!blogger) {
        return res.status(404).json({
          errorCode: ErrorCode.BLOGGER_NOT_FOUND,
          message: "Blogger not found"
        })
      }

      // Remove recommendation from the old blogger's recommendations list
      const oldBlogger = await Blogger.findById(oldBloggerId)
      if (oldBlogger) {
        oldBlogger.recommendations = oldBlogger.recommendations.filter(
          recId =>
            recId.toString() !==
            (recommendation._id as mongoose.Types.ObjectId).toString()
        )
        await oldBlogger.save()
      }
      recommendation.blogger = bloggerId
    }

    // Update other fields
    if (quote) recommendation.quote = quote
    if (rating !== undefined) recommendation.rating = rating
    if (date) recommendation.date = date
    if (url) recommendation.url = url

    await recommendation.save()

    // Handle meal change: remove from old meal's recommendations, add to new meal's recommendations
    if (mealId && mealId !== oldMealId) {
      await Meal.findByIdAndUpdate(oldMealId, {
        $pull: { recommendations: recommendation._id }
      })
      await Meal.findByIdAndUpdate(mealId, {
        $push: { recommendations: recommendation._id }
      })
    }

    // Handle blogger change: add recommendation to the new blogger's recommendations list
    if (bloggerId && bloggerId !== oldBloggerId) {
      await Blogger.findByIdAndUpdate(bloggerId, {
        $push: { recommendations: recommendation._id }
      })
    }

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
