import { ErrorCode } from "@models/api/error-code.enum"
import AppUser from "@models/app-user.model"
import Recommendation from "@models/recommendation.model"
import { NextFunction, Request, Response } from "express"

export const addFavorite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, recommendationId } = req.params

  try {
    // Verify user can only modify their own favorites
    if (req.user?.userId !== userId) {
      return res.status(403).json({
        message: "You can only modify your own favorites",
        errorCode: ErrorCode.FORBIDDEN
      })
    }

    // Check if user exists
    const user = await AppUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    // Check if recommendation exists
    const recommendation = await Recommendation.findById(recommendationId)
    if (!recommendation) {
      return res.status(404).json({
        message: "Recommendation not found",
        errorCode: ErrorCode.RECOMMENDATION_NOT_FOUND
      })
    }

    // Check if already favorited
    if (user.favorites.includes(recommendation._id)) {
      return res.status(400).json({
        message: "Recommendation is already in favorites",
        errorCode: ErrorCode.ALREADY_FAVORITED
      })
    }

    // Add to favorites using $addToSet to prevent duplicates
    await AppUser.findByIdAndUpdate(userId, {
      $addToSet: { favorites: recommendation._id }
    })

    // Fetch updated user with populated favorites
    const updatedUser = await AppUser.findById(userId).populate("favorites")

    return res.status(200).json({
      message: "Recommendation added to favorites successfully",
      data: updatedUser
    })
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add favorite",
      error
    })
  }
}
