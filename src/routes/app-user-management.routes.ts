import { appUserPhoneLogin } from "@controllers/app-user-controllers/auth/app-user-phone-login.controller"
import { appUserGoogleLogin } from "@controllers/app-user-controllers/auth/app-user-google-login.controller"
import { appUserPhoneRegister } from "@controllers/app-user-controllers/auth/app-user-phone-register.controller"
import { verifyOtp } from "@controllers/app-user-controllers/auth/app-user-verify-otp"
import { changeAppUserPassword } from "@controllers/app-user-controllers/auth/change-app-user-password.controller"
import { loginAppUser } from "@controllers/app-user-controllers/auth/login-app-user.controller"
import { deleteAppUser } from "@controllers/app-user-controllers/crud/delete-app-user.controller"
import { getAllAppUsers } from "@controllers/app-user-controllers/crud/get-all-app-users.controller"
import { updateAppUser } from "@controllers/app-user-controllers/crud/update-app-user.controller"
import { authenticate } from "@middlewares/auth.middleware"
import express, { NextFunction, Request, Response } from "express"
const router = express.Router()

// Create a new app user (Phone)
router.post("/register/phone", (req: Request, res: Response) => {
  appUserPhoneRegister(req, res)
})
// Login app user (google)
router.post("/login/google", (req: Request, res: Response) => {
  appUserGoogleLogin(req, res)
})
// Login app user (phone)
router.post("/login/phone", (req: Request, res: Response) => {
  appUserPhoneLogin(req, res)
})
// OTP verification route (can be implemented later)
router.post("/verify-otp", (req: Request, res: Response) => {
  verifyOtp(req, res)
})

// ----------------------------------------------------------------------
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
router.put(
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
