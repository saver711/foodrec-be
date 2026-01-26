import { Request, Response } from "express"
import RefreshToken from "@models/refresh-token.model"

// Logout Controller
export const logout = async (req: Request, res: Response) => {
  try {
    // Get refresh token from various sources (cookies, body, or Authorization header)
    const tokenFromAuthHeader = req.header("Authorization")?.split(" ")[1]
    const { refreshToken: tokenFromBody } = req.body || {}
    
    const cookies = req.headers.cookie?.split(";").reduce((acc: any, cookie) => {
      const [key, value] = cookie.trim().split("=")
      acc[key] = value
      return acc
    }, {})
    const tokenFromCookies = cookies?.refreshToken
    
    const refreshToken = tokenFromAuthHeader || tokenFromBody || tokenFromCookies

    // Delete refresh token from database if it exists
    if (refreshToken) {
      try {
        await RefreshToken.findOneAndDelete({ token: refreshToken })
      } catch (dbError) {
        // Log but don't fail logout if token deletion fails
        console.log("Error deleting refresh token from database:", dbError)
      }
    }

    // Also delete all refresh tokens for this user if userId is available
    if (req.user?.userId) {
      try {
        await RefreshToken.deleteMany({ userId: req.user.userId })
      } catch (dbError) {
        console.log("Error deleting user refresh tokens from database:", dbError)
      }
    }

    // Clear the access token and refresh token cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    })

    res.status(200).json({
      message: "Logged out successfully"
    })
  } catch (error) {
    console.log("error", error)
    res.status(500).json({
      message: "Server error during logout",
      error
    })
  }
}
