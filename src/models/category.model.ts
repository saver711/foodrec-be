import mongoose, { Document, Schema } from "mongoose"

export interface ICategory extends Document {
  name: string
  meals: mongoose.Types.ObjectId[]
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  meals: [{ type: Schema.Types.ObjectId, ref: "Meal" }] // Many-to-many relation with meals
})

export default mongoose.model<ICategory>("Category", CategorySchema)
