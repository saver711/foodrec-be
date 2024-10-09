import { createBlogger } from "@controllers/blogger-controllers/crud/create-blogger"
import { deleteBlogger } from "@controllers/blogger-controllers/crud/delete-blogger"
import { getAllBloggers } from "@controllers/blogger-controllers/crud/get-all-bloggers"
import { updateBlogger } from "@controllers/blogger-controllers/crud/update-blogger"
import { DashboardUserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"
import {
  authenticate,
  authorizeDashboardUser
} from "../middlewares/auth.middleware"

const router = express.Router()

// Create a new blogger (SUPER_ADMIN & AUDITOR)
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
  createBlogger
)

// Get all bloggers (SUPER_ADMIN & AUDITOR)
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
  getAllBloggers
)

// Update a blogger (SUPER_ADMIN only)
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
    updateBlogger(req, res, next)
  }
)

// Delete a blogger (SUPER_ADMIN only)
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
    deleteBlogger(req, res, next)
  }
)

export default router
