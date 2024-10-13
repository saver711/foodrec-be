import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { ErrorCode } from "../../models/api/error-code.enum"
import RefreshToken from "../../models/refresh-token.model"

// Refresh token function
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: requestRefreshToken } = req.body

  if (!requestRefreshToken) {
    return res.status(403).json({ message: "Refresh token is required!" })
  }

  try {
    const storedToken = await RefreshToken.findOne({
      token: requestRefreshToken
    })

    if (!storedToken) {
      return res.status(403).json({
        message: "Refresh token not found!",
        errorCode: ErrorCode.REFRESH_TOKEN_NOT_FOUND
      })
    }

    // Check if the refresh token has expired
    if (RefreshToken.isExpired(storedToken)) {
      await RefreshToken.findByIdAndDelete(storedToken._id) // Remove expired token
      return res.status(403).json({
        message: "Refresh token expired. Please log in again.",
        errorCode: ErrorCode.REFRESH_TOKEN_EXPIRED
      })
    }

    // Decode the refresh token to get user info
    const { userId, userType, role } = jwt.verify(
      storedToken.token,
      process.env.JWT_SECRET as string
    ) as any

    const newAccessToken = jwt.sign(
      { userId, role, userType },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h" }
    )

    res.json({ message: "Refreshed", data: { accessToken: newAccessToken } })
  } catch (error) {
    res.status(500).json({ message: "Could not refresh token", error })
  }
}
