import mongoose, { CallbackError, Document, Schema } from "mongoose"
import Blogger from "./blogger.model"
import Meal from "./meal.model"

export interface IRecommendation extends Document {
  quote: string
  rating?: number
  blogger: mongoose.Types.ObjectId
  meal: mongoose.Types.ObjectId
  date: Date
  url: string
}

const RecommendationSchema: Schema = new Schema({
  quote: { type: String, required: true },
  rating: { type: Number, default: null }, // Optional rating
  blogger: { type: Schema.Types.ObjectId, ref: "Blogger", required: true },
  meal: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
  date: { type: Date, default: Date.now },
  url: { type: String, required: true }
})

RecommendationSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    if (doc.blogger) {
      await Blogger.updateOne(
        { _id: doc.blogger },
        { $pull: { recommendations: doc._id } }
      )
    }
  }
})

// Pre-remove hook to handle recommendation deletions
RecommendationSchema.pre(
  ["findOneAndDelete", "deleteMany"],
  { document: false, query: true },
  async function (next) {
    try {
      const recommendations = await this.model.find(this.getFilter())
      const recommendationIds = recommendations.map((rec: any) =>
        rec._id.toString()
      )

      // 1. Remove recommendations from bloggers
      await Blogger.updateMany(
        { recommendations: { $in: recommendationIds } },
        { $pull: { recommendations: { $in: recommendationIds } } }
      )

      // 2. Remove recommendations from meals
      await Meal.updateMany(
        { recommendations: { $in: recommendationIds } },
        { $pull: { recommendations: { $in: recommendationIds } } }
      )

      next()
    } catch (err) {
      next(err as CallbackError)
    }
  }
)

export default mongoose.model<IRecommendation>(
  "Recommendation",
  RecommendationSchema
)
