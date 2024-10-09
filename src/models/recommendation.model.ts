import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendation extends Document {
  quote: string;
  rating?: number;
  blogger: mongoose.Types.ObjectId;
  meal: mongoose.Types.ObjectId;
  date: Date;
  url: string;
}

const RecommendationSchema: Schema = new Schema({
  quote: { type: String, required: true },
  rating: { type: Number, default: null }, // Optional rating
  blogger: { type: Schema.Types.ObjectId, ref: "Blogger", required: true },
  meal: { type: Schema.Types.ObjectId, ref: "Meal", required: true },
  date: { type: Date, default: Date.now },
  url: { type: String, required: true },
});

export default mongoose.model<IRecommendation>("Recommendation", RecommendationSchema);
