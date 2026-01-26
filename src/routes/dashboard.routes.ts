import { getDashboardStats } from "@controllers/dashboard-controllers/stats/get-dashboard-stats.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

// Get dashboard statistics (Dashboard users only)
router.get(
  "/stats",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response) => {
    getDashboardStats(req, res)
  }
)

export default router
