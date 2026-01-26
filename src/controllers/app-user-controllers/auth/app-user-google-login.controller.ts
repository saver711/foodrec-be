import { OAuth2Client } from "google-auth-library"
import AppUser from "@models/app-user.model"
import {
  generateAccessToken,
  generateRefreshToken
} from "@utils/generate-tokens.util" // For JWT token
import { Request, Response } from "express"
import { UserType } from "@models/user-type.enum"

// Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
// Register App User
export const appUserGoogleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body // ID token sent from the React Native frontend

  try {
    // Verify the ID token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    console.log("ticket", ticket)

    const payload = ticket.getPayload()
    console.log("payload", payload)
    const googleId = payload?.sub // Unique Google user ID
    const email = payload?.email
    console.log("email", email)

    // Check if user already exists by googleId first (most reliable)
    let user = await AppUser.findOne({ googleId })
    console.log("user by googleId", user)
    
    // If not found by googleId, check by email (in case user exists but googleId wasn't set)
    if (!user && email) {
      user = await AppUser.findOne({ email })
      console.log("user by email", user)
      
      // If user exists by email but doesn't have googleId, update it
      if (user && !user.googleId) {
        user.googleId = googleId
        user.isVerified = true // Google users are considered verified
        await user.save()
      }
    }
    
    // Create a new user only if they don't exist at all
    if (!user) {
      try {
        user = new AppUser({
          name: payload?.name,
          googleId,
          email,
          isVerified: true // Google users are considered verified
        })
        console.log("new user", user)
        await user.save()
      } catch (saveError: any) {
        // Handle duplicate key error (race condition or email/googleId conflict)
        if (saveError.code === 11000) {
          // Try to find the user again (might have been created by another request)
          if (googleId) {
            user = await AppUser.findOne({ googleId })
          }
          if (!user && email) {
            user = await AppUser.findOne({ email })
          }
          
          // If still not found, it's a real conflict
          if (!user) {
            return res.status(409).json({
              message: "User with this email or Google ID already exists",
              error: saveError
            })
          }
        } else {
          throw saveError
        }
      }
    }

    // Generate JWT token
    const accessToken = generateAccessToken(
      user._id,
      user.role,
      UserType.AppUser
    )
    console.log("accessToken", accessToken)
    const refreshToken = await generateRefreshToken(
      user._id,
      user.role,
      UserType.AppUser
    )
    console.log("refreshToken", refreshToken)
    return res.status(200).json({
      message: "Login successful",
      data: { user, accessToken, refreshToken }
    })
  } catch (error) {
    console.log("error", error)
    res.status(500).json({ message: "Google authentication failed", error })
  }
}
