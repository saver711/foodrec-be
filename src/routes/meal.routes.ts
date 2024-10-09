import { createMeal } from "@controllers/meal-controllers/crud/create-meal"
import { deleteMeal } from "@controllers/meal-controllers/crud/delete-meal"
import { getAllMeals } from "@controllers/meal-controllers/crud/get-all-meals"
import { updateMeal } from "@controllers/meal-controllers/crud/update-meal"
import {
  authenticate,
  authorizeDashboardUser
} from "@middlewares/auth.middleware"
import { DashboardUserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

// Add a meal recommendation by a blogger
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([
      DashboardUserRole.SUPER_ADMIN,
      DashboardUserRole.AUDITOR
    ])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    createMeal(req, res)
  }
)

router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([
      DashboardUserRole.SUPER_ADMIN,
      DashboardUserRole.AUDITOR
    ])(req, res, next)
  },
  getAllMeals
)

// Update a meal (SUPER_ADMIN & AUDITOR)
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([
      DashboardUserRole.SUPER_ADMIN,
      DashboardUserRole.AUDITOR
    ])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    updateMeal(req, res)
  }
)

// Delete a meal (SUPER_ADMIN only)
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([
      DashboardUserRole.SUPER_ADMIN,
      DashboardUserRole.AUDITOR
    ])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteMeal(req, res)
  }
)
export default router
