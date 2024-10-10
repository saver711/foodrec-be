import { createRecommendation } from "@controllers/recommendation-controllers/crud/create-recommendation.controller"
import { getRecommendationById } from "@controllers/recommendation-controllers/crud/get-recommendation-by-id.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

// Create a new recommendation
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    createRecommendation(req, res)
  }
)
// Get a recommendation by ID
router.get(
  "/:recommendationId",
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
    getRecommendationById(req, res)
  }
)

export default router
