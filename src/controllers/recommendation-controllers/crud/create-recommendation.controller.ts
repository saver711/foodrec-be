import { Request, Response } from "express"
import Recommendation from "@models/recommendation.model"
import Meal from "@models/meal.model"
import Blogger from "@models/blogger.model"
import { ErrorCode } from "@models/api/error-code.enum"
import mongoose from "mongoose"

// Create a new recommendation
export const createRecommendation = async (req: Request, res: Response) => {
  const { mealId, bloggerId, quote, rating, date, url } = req.body

  try {
    // Check if the meal exists
    const meal = await Meal.findById(mealId)
    if (!meal) {
      return res.status(404).json({
        message: "Meal not found",
        errorCode: ErrorCode.MEAL_NOT_FOUND
      })
    }

    // Check if the blogger exists
    const blogger = await Blogger.findById(bloggerId)
    if (!blogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    // Create the recommendation
    const recommendation = new Recommendation({
      meal: mealId,
      blogger: bloggerId,
      quote,
      rating,
      date,
      url
    })

    await recommendation.save()

    // Attach the recommendation to the meal
    meal.recommendations.push(recommendation._id as mongoose.Types.ObjectId)
    await meal.save()

    // Attach the recommendation to the blogger
    blogger.recommendations.push(recommendation._id as mongoose.Types.ObjectId)
    await blogger.save()

    res.status(201).json({
      message: "Recommendation created successfully",
      data: recommendation
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
