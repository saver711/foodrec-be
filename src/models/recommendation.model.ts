import { deleteFilesFromGCS } from "@utils/gcs.util"
import mongoose, { Document, Schema } from "mongoose"
import Blogger from "./blogger.model"
import Category from "./category.model"
import Location from "./location.model"
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

const deletedRecommendationsMap = new Map<string, IRecommendation[]>()

// Utility function to remove references
const removeReferences = async (recommendationIds: string[]) => {
  await Blogger.updateMany(
    { recommendations: { $in: recommendationIds } },
    { $pull: { recommendations: { $in: recommendationIds } } }
  )

  await Restaurant.updateMany(
    { recommendations: { $in: recommendationIds } },
    { $pull: { recommendations: { $in: recommendationIds } } }
  )

  await Location.updateMany(
    { recommendations: { $in: recommendationIds } },
    { $pull: { recommendations: { $in: recommendationIds } } }
  )

  await Category.updateMany(
    { recommendations: { $in: recommendationIds } },
    { $pull: { recommendations: { $in: recommendationIds } } }
  )
}

// Utility function to delete images
const deleteImages = async (recommendations: IRecommendation[]) => {
  for (const recommendation of recommendations) {
    if (recommendation.mealImages && recommendation.mealImages.length > 0) {
      const fileNames = recommendation.mealImages
        .map(img => getFileNameFromUrl(img))
        .filter((fileName): fileName is string => fileName !== undefined)
      await deleteFilesFromGCS(fileNames, "recommendations")
    }
  }
}

// Pre hook for deleteMany
RecommendationSchema.pre("deleteMany", async function () {
  const recommendations = await this.model.find(this.getFilter())
  const key = JSON.stringify(this.getFilter())
  deletedRecommendationsMap.set(key, recommendations)
})

// Post hook for deleteMany
RecommendationSchema.post("deleteMany", async function () {
  try {
    const filterKey = JSON.stringify(this.getFilter())
    const recommendations = deletedRecommendationsMap.get(filterKey)

    if (!recommendations || recommendations.length === 0) {
      console.log("No recommendations found for cleanup.")
      return
    }

    const recommendationIds = recommendations.map(rec => rec._id.toString())

    // Remove references and delete images
    await removeReferences(recommendationIds)
    await deleteImages(recommendations)

    // Clean up the map
    deletedRecommendationsMap.delete(filterKey)
  } catch (err) {
    console.error("Error during post-delete cleanup:", err)
  }
})

// Post hook for findOneAndDelete
RecommendationSchema.post(
  "findOneAndDelete",
  async function (doc: IRecommendation) {
    try {
      if (!doc) {
        console.error("No recommendation document found for post-delete hook.")
        return
      }

      const recommendationId = doc._id.toString()

      // Remove references and delete images
      await removeReferences([recommendationId])
      await deleteImages([doc])

      console.log(`Cleanup complete for recommendation: ${recommendationId}`)
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
