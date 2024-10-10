import { NextFunction, Request, Response } from "express"
import { ErrorCode } from "@models/api/error-code.enum"
import DashboardUser from "@models/dashboard-user.model"
// Update a dashboard user by ID
export const updateDashboardUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const { name, email, role } = req.body

  try {
    const updatedUser = await DashboardUser.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true }
    )
    if (!updatedUser)
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })

    const { password: _, ...userWithoutPassword } = updatedUser.toObject()
    res
      .status(200)
      .json({ message: "User updated successfully", data: userWithoutPassword })
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error })
  }
}
