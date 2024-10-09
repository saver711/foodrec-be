import { Request, Response } from "express"
import Blogger from "@models/blogger.model"

// Get all bloggers (Accessible by all roles)
export const getAllBloggers = async (req: Request, res: Response) => {
  try {
    const bloggers = await Blogger.find()
    res.status(200).json({ data: bloggers })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
