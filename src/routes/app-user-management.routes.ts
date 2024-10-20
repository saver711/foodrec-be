import { appUserGoogleLogin } from "@controllers/app-user-controllers/auth/app-user-google-login.controller"
import { appUserPhoneLogin } from "@controllers/app-user-controllers/auth/app-user-phone-login.controller"
import { appUserPhoneRegister } from "@controllers/app-user-controllers/auth/app-user-phone-register.controller"
import { verifyOtp } from "@controllers/app-user-controllers/auth/app-user-verify-otp"
import { changeAppUserPassword } from "@controllers/app-user-controllers/auth/change-app-user-password.controller"
import { changeAppUserPhoneNumber } from "@controllers/app-user-controllers/crud/change-app-user-phone-number.controller"
import { deleteAppUser } from "@controllers/app-user-controllers/crud/delete-app-user.controller"
import { getAllAppUsers } from "@controllers/app-user-controllers/crud/get-all-app-users.controller"
import { getAppUserById } from "@controllers/app-user-controllers/crud/get-app-user-by-id"
import { toggleFollowBlogger } from "@controllers/app-user-controllers/crud/toggle-follow-blogger"
import { updateAppUser } from "@controllers/app-user-controllers/crud/update-app-user.controller"
import { authenticate, authorizeUser } from "@middlewares/auth.middleware"
import { UserRole } from "@models/user-role.enum"
import { upload } from "@utils/gcs.util"
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
// Get all app users
router.get(
  "/",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  getAllAppUsers
)
// Get a single app user
router.get(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response) => {
    getAppUserById(req, res)
  }
)
// Change password
router.put(
  "/change-password",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    changeAppUserPassword(req, res)
  }
)

// App Users and Super Admin can edit App User info
router.put(
  "/update",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER, UserRole.SUPER_ADMIN])(req, res, next)
  },
  upload.single("image"),
  (req: Request, res: Response) => {
    updateAppUser(req, res)
  }
)

// App Users and Super Admin can change phone number for App User
router.put(
  "/change-phone",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.APP_USER, UserRole.SUPER_ADMIN])(req, res, next)
  },
  (req: Request, res: Response) => {
    changeAppUserPhoneNumber(req, res)
  }
)

// Delete app user (SUPER_ADMIN only)
router.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    authorizeUser([UserRole.SUPER_ADMIN])(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    deleteAppUser(req, res)
  }
)
router.post(
  "/bloggers/:bloggerId/follow",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response, next: NextFunction) => {
    toggleFollowBlogger(req, res)
  }
)

export default router
