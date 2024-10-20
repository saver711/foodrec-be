import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import DashboardUser from "@models/dashboard-user.model"
import AppUser from "@models/app-user.model"
import { ErrorCode } from "@models/api/error-code.enum"
import { UserRole } from "@models/user-role.enum"

// Middleware to check if the user is authenticated
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.split(" ")[1] // Bearer token

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid", error })
  }
}

// Middleware for authorizing roles and checking verification status
export const authorizeUser = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboardUser = await DashboardUser.findById(req.user?.userId)
      const appUser = await AppUser.findById(req.user?.userId)

      const user = dashboardUser || appUser

      // Check if the user exists and is one of the allowed roles
      if (!user || !roles.includes(user.role as UserRole)) {
        return res
          .status(403)
          .json({
            message: "Access denied",
            errorCode: ErrorCode.ACCESS_DENIED
          })
      }

      // If the user is an app user, ensure they are verified
      if (appUser && !appUser.isVerified) {
        return res.status(403).json({
          message: "User is not verified",
          errorCode: ErrorCode.USER_NOT_VERIFIED
        })
      }

      // Proceed to the next middleware if all checks pass
      next()
    } catch (error) {
      return res.status(500).json({
        message: "Server error during authorization",
        error
      })
    }
  }
}
