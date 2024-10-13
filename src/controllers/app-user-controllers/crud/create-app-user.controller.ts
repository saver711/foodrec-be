import bcrypt from "bcryptjs"
import { Request, Response } from "express"
import AppUser from "@models/app-user.model"

// Create an app user (normal mobile app user)
export const createAppUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new AppUser({
      name,
      email,
      password: hashedPassword
    })

    await user.save()
    res
      .status(201)
      .json({ message: "App user created successfully", data: user })
  } catch (error) {
    res.status(500).json({ message: "Error creating app user", error })
  }
}
