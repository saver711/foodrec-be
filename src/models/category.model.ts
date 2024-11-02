import mongoose, { Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  recommendations: mongoose.Types.ObjectId[]
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }] // Many-to-many relation with recommendations
})

export default mongoose.model<ICategory>("Category", CategorySchema)
