import { refreshToken } from "@controllers/auth-controllers/refresh-token.controller"
import express, { Request, Response } from "express"

const router = express.Router()
router.post("/refresh-token", (req: Request, res: Response) => {
  refreshToken(req, res)
})

export default router
