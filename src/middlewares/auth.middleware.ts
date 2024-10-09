import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import DashboardUser, { IDashboardUser } from "@models/dashboard-user.model"
import { ErrorCode } from "@models/api/error-code.enum"
import { DashboardUserRole } from "@models/user-role.enum"
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

// Middleware for authorizing roles
export const authorizeDashboardUser = (roles: DashboardUserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await DashboardUser.findById(req.user?.userId)
    if (!user || !roles.includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied", errorCode: ErrorCode.ACCESS_DENIED })
    }
    next()
  }
}
