import { UserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"
import { authenticate, authorizeUser } from "../middlewares/auth.middleware"
import { getAllLocations } from "@controllers/restaurant-controllers/crud/get-all-locations"

const router = express.Router()

// Get all locations
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
      req,
      res,
      next
    )
  },
  (req: Request, res: Response, next: NextFunction) => {
    getAllLocations(req, res)
  }
)
export default router
