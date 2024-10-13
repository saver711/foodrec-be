import { createMeal } from "@controllers/meal-controllers/crud/create-meal.controller"
import { deleteMeal } from "@controllers/meal-controllers/crud/delete-meal.controller"
import { getAllMeals } from "@controllers/meal-controllers/crud/get-all-meals.controller"
import { getMealById } from "@controllers/meal-controllers/crud/get-meal-by-id"
import { getMealsByRestaurantId } from "@controllers/meal-controllers/crud/get-meals-by-restaurant-id.controller"
import { updateMeal } from "@controllers/meal-controllers/crud/update-meal.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/gcs.util"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

// /api/meals
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  upload.array("images"),
  (req: Request, res: Response, next: NextFunction) => {
    createMeal(req, res)
  }
)

// /api/meals
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
  getAllMeals
)

// Get meal by id
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
    getMealById(req, res)
  }
)

// Update a meal (SUPER_ADMIN & AUDITOR)
// /api/meals/id
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  upload.array("images"),
  (req: Request, res: Response, next: NextFunction) => {
    updateMeal(req, res)
  }
)

// Delete a meal (SUPER_ADMIN only)
// /api/meals/id
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteMeal(req, res)
  }
)

// Get meals by restaurant
// /api/meals/restaurant/restaurantId
router.get(
  "/restaurant/:restaurantId",
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
    getMealsByRestaurantId(req, res)
  }
)
export default router
