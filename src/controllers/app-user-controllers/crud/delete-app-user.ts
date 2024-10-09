import { Request, Response } from "express"
import AppUser from "@models/app-user.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Delete an app user by ID
export const deleteAppUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const deletedUser = await AppUser.findByIdAndDelete(id)
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
