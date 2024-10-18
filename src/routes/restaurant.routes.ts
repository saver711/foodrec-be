import { createRestaurant } from "@controllers/restaurant-controllers/crud/create-restaurant.controller"
import { deleteRestaurant } from "@controllers/restaurant-controllers/crud/delete-restaurant.controller"
import { getAllRestaurants } from "@controllers/restaurant-controllers/crud/get-all-restaurants.controller"
import { getRestaurantById } from "@controllers/restaurant-controllers/crud/get-restaurant-by-id.controller"
import { updateRestaurant } from "@controllers/restaurant-controllers/crud/update-restaurant.controller"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/gcs.util"
import express, { NextFunction, Request, Response } from "express"
import { authenticate, authorizeUser } from "../middlewares/auth.middleware"

const router = express.Router()

// Create a new restaurant (SUPER_ADMIN & AUDITOR)
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  upload.single("logo"),
  (req: Request, res: Response, next: NextFunction) => {
    createRestaurant(req, res)
  }
)

// Get all restaurants (SUPER_ADMIN & AUDITOR)
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
    getAllRestaurants(req, res)
  }
)

// Update a restaurant (SUPER_ADMIN & AUDITOR)
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  upload.single("logo"),
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
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteRestaurant(req, res)
  }
)

// Get Restaurant by id
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
    getRestaurantById(req, res)
  }
)

export default router
