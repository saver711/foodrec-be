import { deleteFilesFromS3, deleteFilesWrapper } from "@utils/s3.util"
import mongoose, { Document, Schema } from "mongoose"
import Blogger from "./blogger.model"
import Category from "./category.model"
import Location from "./location.model"
import { LocationsCriteria } from "./locations/locations-criteria.enum"
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

  locationsCriteria: LocationsCriteria

  // changed to array of ObjectIds
  /* CHANGED: now always an array of valid location IDs */
  locations: mongoose.Types.ObjectId[]
}

const RecommendationSchema: Schema<IRecommendation> =
  new Schema<IRecommendation>({
    quote: { type: String, required: true },
    rating: { type: Number, default: null },
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

    /* CHANGED: new field for location criteria */
    locationsCriteria: {
      type: String,
      enum: [
        LocationsCriteria.ALL_LOCATIONS,
        LocationsCriteria.SPECIFIC_LOCATIONS
      ],
      required: true
    },

    /* CHANGED: always an array of ObjectIds, referencing Location */
    locations: [
      {
        type: Schema.Types.ObjectId,
        ref: "Location"
      }
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
    await deleteFilesWrapper(recommendations, "mealImages", "recommendations")

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
      await deleteFilesWrapper([doc], 'mealImages', 'recommendations')

      console.log(`Cleanup complete for recommendation: ${recommendationId}`)
    } catch (err) {
      console.error("Error during recommendation post-delete cleanup:", err)
    }
  }
)



export default mongoose.model<IRecommendation>(
  "Recommendation",
  RecommendationSchema
)
