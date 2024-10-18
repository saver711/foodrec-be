import { createBlogger } from "@controllers/blogger-controllers/crud/create-blogger.controller"
import { deleteBlogger } from "@controllers/blogger-controllers/crud/delete-blogger.controller"
import { getAllBloggers } from "@controllers/blogger-controllers/crud/get-all-bloggers.controller"
import { getBloggerById } from "@controllers/blogger-controllers/crud/get-blogger-by-id.controller"
import { updateBlogger } from "@controllers/blogger-controllers/crud/update-blogger.controller"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/gcs.util"
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
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    createBlogger(req, res)
  }
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
  upload.single("image"),
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

// Get a blogger by ID (SUPER_ADMIN & AUDITOR)
router.get(
  "/:bloggerId",
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
    getBloggerById(req, res)
  }
)

export default router
