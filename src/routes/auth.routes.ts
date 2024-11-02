import { logout } from "@controllers/auth-controllers/logout.controller"
import { refreshToken } from "@controllers/auth-controllers/refresh-token.controller"
import { authenticate } from "@middlewares/auth.middleware"
import express, { NextFunction, Request, Response } from "express"

const router = express.Router()
router.post("/refresh-token", (req: Request, res: Response) => {
  refreshToken(req, res)
})

export default router
