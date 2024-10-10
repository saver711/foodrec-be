import { Request, Response } from "express"
import AppUser from "@models/app-user.model"
import { ErrorCode } from "@models/api/error-code.enum"

// Update an app user by ID
export const updateAppUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, email, favMeals, following } = req.body

  try {
    const updatedUser = await AppUser.findByIdAndUpdate(
      id,
      { name, email, favMeals, following },
      { new: true }
    )
    if (!updatedUser)
      return res.status(404).json({
        message: "User not found",
        errorCode: ErrorCode.USER_NOT_FOUND
      })

    res
      .status(200)
      .json({ message: "User updated successfully", data: updatedUser })
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error })
  }
}
