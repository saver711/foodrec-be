import { refreshToken } from "@controllers/auth-controllers/refresh-token.controller"
import { logout } from "@controllers/auth-controllers/logout.controller"
import { authenticate } from "@middlewares/auth.middleware"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()

router.post("/refresh-token", (req: Request, res: Response) => {
  refreshToken(req, res)
})

// Logout route (for both app users and dashboard users)
router.post(
  "/logout",
  (req: Request, res: Response, next: NextFunction) => {
    authenticate(req, res, next)
  },
  (req: Request, res: Response) => {
    logout(req, res)
  }
)

export default router
