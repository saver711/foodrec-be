import { createRecommendation } from "@controllers/recommendation-controllers/crud/create-recommendation.controller"
import { deleteRecommendation } from "@controllers/recommendation-controllers/crud/delete-recommendation.controller"
import { getAllRecommendations } from "@controllers/recommendation-controllers/crud/get-all-recommendations.controller"
import { getRecommendationById } from "@controllers/recommendation-controllers/crud/get-recommendation-by-id.controller"
import { updateRecommendation } from "@controllers/recommendation-controllers/crud/update-recommendation.controller"
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
  "/:id",
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

// Update a recommendation by ID
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next) // Allow SUPER_ADMIN and AUDITOR to update
  },
  (req: Request, res: Response, next: NextFunction) => {
    updateRecommendation(req, res)
  }
)

// Get all recommendations
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
    getAllRecommendations(req, res)
  }
)

// Delete a recommendation by ID
router.delete(
  "/:recommendationId",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next) // Only SUPER_ADMIN and AUDITOR can delete
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteRecommendation(req, res)
  }
)

export default router
