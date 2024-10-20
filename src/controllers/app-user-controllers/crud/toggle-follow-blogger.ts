import { Request, Response } from "express"
import AppUser from "@models/app-user.model"
import Blogger from "@models/blogger.model"
import { ErrorCode } from "@models/api/error-code.enum"
import mongoose from "mongoose"

// Toggle follow/unfollow a blogger
export const toggleFollowBlogger = async (req: Request, res: Response) => {
  const userId = req.user?.userId // Get the user ID from authentication middleware
  const { bloggerId } = req.params // Get the blogger ID from URL parameters

  try {
    // Validate blogger existence
    const blogger = await Blogger.findById(bloggerId)
    if (!blogger) {
      return res.status(404).json({
        message: "Blogger not found",
        errorCode: ErrorCode.BLOGGER_NOT_FOUND
      })
    }

    // Find the app user
    const appUser = await AppUser.findById(userId)
    if (!appUser) {
      return res.status(404).json({
        message: "App User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })
    }

    const isFollowing = appUser.following.includes(
      bloggerId as unknown as mongoose.Types.ObjectId
    )

    if (isFollowing) {
      // Unfollow the blogger
      appUser.following = appUser.following.filter(
        id => id.toString() !== bloggerId
      )
      blogger.followers = blogger.followers.filter(
        id => id.toString() !== userId
      )

      await appUser.save()
      await blogger.save()

      return res.status(200).json({
        message: "Unfollowed the blogger successfully",
        data: { following: false }
      })
    } else {
      // Follow the blogger
      appUser.following.push(blogger._id)
      blogger.followers.push(appUser._id)

      await appUser.save()
      await blogger.save()

      return res.status(200).json({
        message: "Followed the blogger successfully",
        data: { following: true }
      })
    }
  } catch (error) {
    res.status(500).json({
      message: "Error toggling follow/unfollow",
      error
    })
  }
}
