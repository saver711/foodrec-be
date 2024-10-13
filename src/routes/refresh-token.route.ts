import express, { Request, Response } from "express"
import { refreshToken } from "@controllers/auth-controllers/refresh-token.controller"

const router = express.Router()
// Refresh token route
router.post("/", (req: Request, res: Response) => {
  refreshToken(req, res)
})

export default router
