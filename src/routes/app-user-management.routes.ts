import { changeAppUserPassword } from "@controllers/app-user-controllers/auth/change-app-user-password"
import { loginAppUser } from "@controllers/app-user-controllers/auth/login-app-user"
import { createAppUser } from "@controllers/app-user-controllers/crud/create-app-user.controller"
import { deleteAppUser } from "@controllers/app-user-controllers/crud/delete-app-user"
import { getAllAppUsers } from "@controllers/app-user-controllers/crud/get-all-app-users"
import { updateAppUser } from "@controllers/app-user-controllers/crud/update-app-user"
import { authenticate } from "@middlewares/auth.middleware"
import express, { NextFunction, Request, Response } from "express"
const router = express.Router()

// Create a new app user
router.post("/register", (req: Request, res: Response) => {
  createAppUser(req, res)
})

// Login app user
router.post("/login", (req: Request, res: Response) => {
  loginAppUser(req, res)
})

// Get all app users (SUPER_ADMIN only)
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  getAllAppUsers
)
// Change password (Mobile App User)
router.post(
  "/change-password",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    changeAppUserPassword(req, res)
  }
)
// Update app user (SUPER_ADMIN only)
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response) => {
    updateAppUser(req, res)
  }
)

// Delete app user (SUPER_ADMIN only)
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteAppUser(req, res)
  }
)
export default router
