import { createRestaurant } from "@controllers/restaurant-controllers/crud/create-restaurant.controller"
import { deleteRestaurant } from "@controllers/restaurant-controllers/crud/delete-restaurant.controller"
import { deleteMultiRestaurants } from "@controllers/restaurant-controllers/crud/delete-multi-restaurants.controller"
import { getAllRestaurants } from "@controllers/restaurant-controllers/crud/get-all-restaurants.controller"
import { getRestaurantsByIds } from "@controllers/restaurant-controllers/crud/get-restaurants-by-ids.controller"
import { updateRestaurant } from "@controllers/restaurant-controllers/crud/update-restaurant.controller"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/gcs.util"
import express, { NextFunction, Request, Response } from "express"
import { authenticate, authorizeUser } from "../middlewares/auth.middleware"
import { getRestaurantById } from "@controllers/restaurant-controllers/get-restaurant-by-id.controller"

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

// Delete a restaurant by ID (SUPER_ADMIN & AUDITOR)
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

// Delete multiple restaurants (SUPER_ADMIN & AUDITOR)
router.delete(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response) => {
    deleteMultiRestaurants(req, res)
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
router.post(
  "/restaurantsIds",
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
    getRestaurantsByIds(req, res)
  }
)

export default router
