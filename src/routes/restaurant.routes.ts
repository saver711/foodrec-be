import { createRestaurant } from "@controllers/restaurant-controllers/crud/create-restaurant"
import { deleteRestaurant } from "@controllers/restaurant-controllers/crud/delete-restaurant"
import { getAllRestaurants } from "@controllers/restaurant-controllers/crud/get-all-restaurants"
import { updateRestaurant } from "@controllers/restaurant-controllers/crud/update-restaurant"
import { DashboardUserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"
import {
  authenticate,
  authorizeDashboardUser
} from "../middlewares/auth.middleware"

const router = express.Router()

// Create a new restaurant (SUPER_ADMIN & AUDITOR)
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
  createRestaurant
)

// Get all restaurants (SUPER_ADMIN & AUDITOR)
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
  getAllRestaurants
)

// Update a restaurant (SUPER_ADMIN & AUDITOR)
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
    updateRestaurant(req, res)
  }
)

// Delete a restaurant (SUPER_ADMIN only)
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
    deleteRestaurant(req, res)
  }
)

export default router
