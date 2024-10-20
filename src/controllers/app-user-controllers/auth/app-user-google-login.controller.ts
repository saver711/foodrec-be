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

    const payload = ticket.getPayload()
    const googleId = payload?.sub // Unique Google user ID
    const email = payload?.email

    // Check if user already exists in the database
    let user = await AppUser.findOne({ googleId })

    if (!user) {
      // Create a new user if they don't exist
      user = new AppUser({
        name: payload?.name,
        googleId,
        email,
        isVerified: true // Google users are considered verified
      })

      await user.save()
    }

    // Generate JWT token
    const accessToken = generateAccessToken(
      user._id,
      user.role,
      UserType.AppUser
    )
    const refreshToken = await generateRefreshToken(
      user._id,
      user.role,
      UserType.AppUser
    )

    return res.status(200).json({
      message: "Login successful",
      data: { user, accessToken, refreshToken }
    })
  } catch (error) {
    res.status(500).json({ message: "Google authentication failed", error })
  }
}
