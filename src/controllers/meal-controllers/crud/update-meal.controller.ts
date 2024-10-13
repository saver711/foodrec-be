import Meal from "@models/meal.model"
import { deleteFilesFromGCS, uploadFilesToGCS } from "@utils/gcs.util" // Import GCS utility functions
import { Request, Response } from "express"

// Update a meal by ID
export const updateMeal = async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, description, categories } = req.body
  const files = req.files as Express.Multer.File[] // Get uploaded images

  try {
    // Find the meal by ID
    const meal = await Meal.findById(id)
    if (!meal) {
      return res.status(404).json({
        message: "Meal not found"
      })
    }

    // If new images are uploaded, delete old images from GCS and upload new ones
    if (files && files.length > 0) {
      if (meal.images && meal.images.length > 0) {
        // Delete the old images from GCS
        await deleteFilesFromGCS(meal.images, "meals")
      }

      // Upload new images to GCS
      const uploadedImages = await uploadFilesToGCS(files, "meals")
      meal.images = uploadedImages // Update images with the new ones
    }

    // Update the meal with new data
    meal.name = name || meal.name
    meal.description = description || meal.description
    meal.categories = categories || meal.categories

    // Save the updated meal
    await meal.save()

    res.status(200).json({ message: "Meal updated successfully", data: meal })
  } catch (error) {
    res.status(500).json({ message: "Error updating meal", error })
  }
}
