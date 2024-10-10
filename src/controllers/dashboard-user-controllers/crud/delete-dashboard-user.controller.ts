import { NextFunction, Request, Response } from "express"
import { ErrorCode } from "@models/api/error-code.enum"
import DashboardUser from "@models/dashboard-user.model"

export const deleteDashboardUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params

  try {
    const deletedUser = await DashboardUser.findByIdAndDelete(id)
    if (!deletedUser)
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })

    res.status(200).json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error })
  }
}
