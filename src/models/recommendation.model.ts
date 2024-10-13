import mongoose, { Document, Schema } from "mongoose"
import Blogger from "./blogger.model"

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

RecommendationSchema.post("deleteMany", async function (doc) {
  const recommendations = doc.result.n // Capture deleted recommendations
  if (recommendations) {
    // Remove recommendations from bloggers' lists
    await Blogger.updateMany(
      { recommendations: { $in: recommendations } },
      { $pull: { recommendations: { $in: recommendations } } }
    )
  }
})

export default mongoose.model<IRecommendation>(
  "Recommendation",
  RecommendationSchema
)
