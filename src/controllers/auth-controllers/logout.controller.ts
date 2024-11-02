import { Request, Response } from "express"

// Logout Controller
export const logout = (req: Request, res: Response) => {
  try {
    // Clear the access token and refresh token cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    })

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    })

    res.status(200).json({
      message: "Logged out successfully"
    })
  } catch (error) {
    res.status(500).json({
      message: "Server error during logout",
      error
    })
  }
}
