import express, { Request, Response, NextFunction } from "express"
import { createCategory } from "@controllers/category-controllers/crud/create-category.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum" // Assuming you have roles defined here

const router = express.Router()

// Create a new category
router.post(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN, UserRole.AUDITOR])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    createCategory(req, res)
  }
)

export default router
