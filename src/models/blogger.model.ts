import mongoose, { Schema, Document } from "mongoose"

export interface IBlogger extends Document {
  name: string
  bio: string
  image: string
  socialLinks: { platform: string; url: string }[]
  recommendations: mongoose.Types.ObjectId[]
  followers: mongoose.Types.ObjectId[]
}

const BloggerSchema: Schema = new Schema({
  name: { type: String, required: true },
  bio: { type: String, required: true },
  image: { type: String }, // URL to blogger's image
  socialLinks: [
    {
      platform: { type: String },
      url: { type: String }
    }
  ],
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }], // Many recommendations
  // TODO: ref is User or AppUser?
  followers: [{ type: Schema.Types.ObjectId, ref: "AppUser" }] // Many followers
})

export default mongoose.model<IBlogger>("Blogger", BloggerSchema)
