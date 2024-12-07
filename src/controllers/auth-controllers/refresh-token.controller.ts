import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { ErrorCode } from "../../models/api/error-code.enum"
import RefreshToken from "../../models/refresh-token.model"

// Refresh token function using HTTP-only cookies
export const refreshToken = async (req: Request, res: Response) => {
  // Get the refresh token from the cookies
  const tokenFromAuthHeader = req.header("Authorization")?.split(" ")[1] // Bearer token // Temp for Postman
  const { refreshToken: tokenFromBody } = req.body

  const cookies = req.headers.cookie?.split(";").reduce((acc: any, cookie) => {
    const [key, value] = cookie.trim().split("=")
    acc[key] = value
    return acc
  }, {})
  const tokenFromCookies = cookies?.refreshToken
  const requestRefreshToken =
    tokenFromAuthHeader || tokenFromBody || tokenFromCookies

  if (!requestRefreshToken) {
    return res.status(403).json({
      message: "Refresh token is required!",
      errorCode: ErrorCode.NO_TOKEN_PROVIDED
    })
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
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
      })
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

    // Generate a new access token
    const newAccessToken = jwt.sign(
      { userId, role, userType },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h" }
    )

    // Set the access token in the HTTP-only cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
      // maxAge: 1 * 60 * 1000

      // maxAge:
      //   (+process.env.ACCESS_TOKEN_EXPIRES_IN!.charAt(0) || 1) *
      //   24 *
      //   60 *
      //   60 *
      //   1000 // 1 day
    })

    // Optionally, you can update the refresh token if necessary (refresh token rotation)

    // Response without sending the access token in the body
    res.json({ message: "Refreshed", data: { accessToken: newAccessToken } }) // TEMP for Postman
  } catch (error) {
    res.status(500).json({ message: "Could not refresh token", error })
  }
}
