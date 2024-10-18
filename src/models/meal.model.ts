import Category from "@models/category.model"
import Recommendation from "@models/recommendation.model"
import Restaurant from "@models/restaurant.model"
import { deleteFilesFromGCS } from "@utils/gcs.util"
import mongoose, { CallbackError, Document, Schema } from "mongoose"
export interface IMeal extends Document {
  name: string
  description: string
  images: string[]
  categories: mongoose.Types.ObjectId[]
  // likedBy: mongoose.Types.ObjectId[]
  recommendations: mongoose.Types.ObjectId[]
  restaurant: mongoose.Types.ObjectId // Linked restaurant
}

const MealSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // List of image URLs
  categories: [{ type: Schema.Types.ObjectId, ref: "Category" }], // Many-to-many relation with categories
  // likedBy: [{ type: Schema.Types.ObjectId, ref: "User" }], // Many-to-many relation with users
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }], // Many recommendations
  restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" }
})

// Pre-remove hook to handle meal deletions
MealSchema.pre(
  ["findOneAndDelete", "deleteMany"],
  { document: false, query: true },
  async function (next) {
    // Retrieve meals based on the filter (for both single and multiple deletions)
    const meals = await this.model.find(this.getFilter())

    try {
      // Loop through the meals (whether single or multiple)
      for (const meal of meals) {
        // 1. Delete meal images from GCS for each meal
        if (meal.images.length > 0) {
          await deleteFilesFromGCS(
            meal.images.map((img: string) => getFileNameFromUrl(img)),
            "meals" // This will make sure the file path is "meals/<file_name>"
          )
        }

        // 2. Delete associated recommendations for each meal
        await Recommendation.deleteMany({ meal: meal._id })

        // 3. Remove meal from associated restaurant
        await Restaurant.updateMany(
          { meals: meal._id },
          { $pull: { meals: meal._id } }
        )

        // 4. Remove meal from associated categories
        await Category.updateMany(
          { meals: meal._id },
          { $pull: { meals: meal._id } }
        )
      }

      next() // Proceed with the deletion
    } catch (err) {
      next(err as CallbackError)
    }
  }
)

// Utility function to get filename from a GCS URL
const getFileNameFromUrl = (url: string) => url.split("/").pop()

export default mongoose.model<IMeal>("Meal", MealSchema)
