import { getAllLocations } from "@controllers/location-controllers/crud/get-all-locations.controller"
import { getAllMapLocations } from "@controllers/location-controllers/crud/get-all-map-locations.controller"
import { UserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"
import { authenticate, authorizeUser } from "../middlewares/auth.middleware"
import { getLocationsByRestaurantId } from "@controllers/location-controllers/crud/get-locations-by-restaurant-id.controller"

const router = express.Router()

// Get all locations with filters, sorting, and populating
router.get(
  "/",
  // (req: Request, res: Response, next: NextFunction) => {
  //   authenticate(req, res, next)
  // },
  // (req: Request, res: Response, next: NextFunction) => {
  //   authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
  //     req,
  //     res,
  //     next
  //   )
  // },
  (req: Request, res: Response, next: NextFunction) => {
    getAllLocations(req, res)
  }
)

// Get all map locations (with bounding box)
router.get(
  "/map",
  // (req: Request, res: Response, next: NextFunction) => {
  //   authenticate(req, res, next)
  // },
  // (req: Request, res: Response, next: NextFunction) => {
  //   authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
  //     req,
  //     res,
  //     next
  //   )
  // },
  (req: Request, res: Response, next: NextFunction) => {
    getAllMapLocations(req, res)
  }
)

// Get locations by restaurant id
router.get(
  "/restaurant/:restaurantId",
  // (req: Request, res: Response, next: NextFunction) => {
  //   authenticate(req, res, next)
  // },
  // (req: Request, res: Response, next: NextFunction) => {
  //   authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
  //     req,
  //     res,
  //     next
  //   )
  // },
  (req: Request, res: Response, next: NextFunction) => {
    getLocationsByRestaurantId(req, res)
  }
)
export default router
