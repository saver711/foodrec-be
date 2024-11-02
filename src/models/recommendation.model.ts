import { deleteFilesFromGCS } from "@utils/gcs.util"
import mongoose, { Document, Schema } from "mongoose"
import Blogger from "./blogger.model"
import Category from "./category.model"
import Restaurant from "./restaurant.model"

export interface IRecommendation extends Document {
  quote: string
  rating?: number
  date: Date
  url: string
  mealName: string
  mealDescription: string
  mealImages: string[]
  restaurant: mongoose.Types.ObjectId
  categories: mongoose.Types.ObjectId[]
  blogger: mongoose.Types.ObjectId
}

const RecommendationSchema: Schema = new Schema<IRecommendation>({
  quote: { type: String, required: true },
  rating: { type: Number, default: null }, // Optional rating
  blogger: { type: Schema.Types.ObjectId, ref: "Blogger", required: true },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  mealName: { type: String, required: true, unique: true },
  mealDescription: { type: String },
  mealImages: [{ type: String, default: [] }],
  categories: [
    { type: Schema.Types.ObjectId, ref: "Category", required: true }
  ],
  date: { type: Date, default: Date.now },
  url: { type: String, required: true }
})

// Post hook to handle cleanup after recommendation deletion
RecommendationSchema.post(
  ["findOneAndDelete", "deleteMany"],
  async function (doc: IRecommendation) {
    try {
      const recommendations: IRecommendation[] = doc
        ? [doc]
        : await this.model.find(this.getFilter())

      const recommendationIds = recommendations.map(rec => rec._id.toString())

      // Remove recommendations from bloggers
      await Blogger.updateMany(
        { recommendations: { $in: recommendationIds } },
        { $pull: { recommendations: { $in: recommendationIds } } }
      )

      // Loop through the recommendations for additional cleanup
      for (const recommendation of recommendations) {
        // Delete recommendation images from GCS
        if (recommendation.mealImages.length > 0) {
          const fileNames = recommendation.mealImages
            .map(img => getFileNameFromUrl(img))
            .filter((fileName): fileName is string => fileName !== undefined)

          if (fileNames.length > 0) {
            await deleteFilesFromGCS(fileNames, "recommendations")
          }
        }

        // Remove recommendation from associated restaurant
        await Restaurant.updateMany(
          { recommendations: recommendation._id },
          { $pull: { recommendations: recommendation._id } }
        )

        // Remove recommendation from associated categories
        await Category.updateMany(
          { recommendations: recommendation._id },
          { $pull: { recommendations: recommendation._id } }
        )
      }
    } catch (err) {
      console.error("Error during recommendation post-delete cleanup:", err)
    }
  }
)

const getFileNameFromUrl = (url: string) => url.split("/").pop()

export default mongoose.model<IRecommendation>(
  "Recommendation",
  RecommendationSchema
)
