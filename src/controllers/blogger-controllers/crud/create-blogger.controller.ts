import { Request, Response } from "express"
import Blogger, { IBlogger } from "@models/blogger.model"

// Add a new blogger (SUPER_ADMIN only)
export const createBlogger = async (req: Request, res: Response) => {
  const { name, bio, socialLinks, image } = req.body

  try {
    const blogger: IBlogger = new Blogger({
      name,
      bio,
      socialLinks,
      image
    })

    await blogger.save()
    res
      .status(201)
      .json({ message: "Blogger added successfully", data: blogger })
  } catch (error) {
    res.status(500).json({ message: "Server error", error })
  }
}
