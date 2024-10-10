import { createBlogger } from "@controllers/blogger-controllers/crud/create-blogger.controller"
import { deleteBlogger } from "@controllers/blogger-controllers/crud/delete-blogger.controller"
import { getAllBloggers } from "@controllers/blogger-controllers/crud/get-all-bloggers.controller"
import { updateBlogger } from "@controllers/blogger-controllers/crud/update-blogger.controller"
import { UserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"
import { authenticate, authorizeUser } from "../middlewares/auth.middleware"

const router = express.Router()

// Create a new blogger (SUPER_ADMIN & AUDITOR)
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
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
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR, UserRole.APP_USER])(
      req,
      res,
      next
    )
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
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
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
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteBlogger(req, res, next)
  }
)

export default router
