import { changeDashboardUserPassword } from "@controllers/dashboard-user-controllers/auth/change-dashboard-user-password"
import { loginDashboardUser } from "@controllers/dashboard-user-controllers/auth/login-dashboard-user"
import { createDashboardUser } from "@controllers/dashboard-user-controllers/crud/create-dashboard-user.controller"
import { deleteDashboardUser } from "@controllers/dashboard-user-controllers/crud/delete-dashboard-user"
import { getAllDashboardUsers } from "@controllers/dashboard-user-controllers/crud/get-all-dashboard-users"
import { updateDashboardUser } from "@controllers/dashboard-user-controllers/crud/update-dashboard-user"
import {
  authenticate,
  authorizeDashboardUser
} from "@middlewares/auth.middleware"
import { DashboardUserRole } from "@models/user-role.enum"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

// Create a new dashboard user (SUPER_ADMIN only)
router.post(
  "/register",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },

  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([DashboardUserRole.SUPER_ADMIN])(req, res, next)
  },

  (req: Request, res: Response, next: NextFunction) => {
    createDashboardUser(req, res, next)
  }
)

// Change password (Dashboard User - SUPER_ADMIN or AUDITOR)
router.post(
  "/change-password",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response) => {
    changeDashboardUserPassword(req, res)
  }
)

router.post("/login", (req: Request, res: Response) => {
  loginDashboardUser(req, res)
})

// Get all dashboard users (SUPER_ADMIN only)
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },

  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([DashboardUserRole.SUPER_ADMIN])(req, res, next)
  },
  getAllDashboardUsers
)

// Update a dashboard user (SUPER_ADMIN only)
router.put(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },

  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([DashboardUserRole.SUPER_ADMIN])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    updateDashboardUser(req, res, next)
  }
)

// Delete a dashboard user (SUPER_ADMIN only)
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },

  (req: Request, res: Response, next: NextFunction) => {
    authorizeDashboardUser([DashboardUserRole.SUPER_ADMIN])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteDashboardUser(req, res, next)
  }
)

export default router
