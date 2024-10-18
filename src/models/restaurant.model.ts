import { deleteFileFromGCS } from "@utils/gcs.util"
import mongoose, { CallbackError, Document, Schema } from "mongoose"
import path from "path"
import Location from "@models/location.model"
import Meal from "@models/meal.model"
export interface IRestaurant extends Document {
  name: string
  logo: string
  meals: mongoose.Types.ObjectId[]
  locations: mongoose.Types.ObjectId[]
}

const RestaurantSchema: Schema = new Schema({
  name: { type: String, required: true },
  logo: { type: String }, // URL to restaurant's logo
  meals: [{ type: Schema.Types.ObjectId, ref: "Meal" }], // Restaurant has many meals
  locations: [{ type: Schema.Types.ObjectId, ref: "Location" }] // Restaurant has many locations
})

// Pre-remove hook to handle restaurant deletion
RestaurantSchema.pre(
  ["findOneAndDelete", "deleteMany"],
  { document: false, query: true },
  async function (next) {
    const restaurants = await this.model.find(this.getFilter()) // Find restaurant(s) being deleted

    try {
      // Loop through each restaurant and handle deletions
      for (const restaurant of restaurants) {
        // 1. Delete restaurant's logo from GCS
        if (restaurant.logo) {
          const oldLogoFileName = path.basename(restaurant.logo)
          await deleteFileFromGCS(`restaurants/${oldLogoFileName}`)
        }

        // 2. Delete associated locations
        await Location.deleteMany({ restaurant: restaurant._id })

        // 3. Find and delete all meals associated with the restaurant
        const meals = await Meal.find({ restaurant: restaurant._id })
        const mealIds = meals.map(meal => meal._id)
        await Meal.deleteMany({ restaurant: restaurant._id })
      }

      next() // Proceed with the deletion
    } catch (err) {
      next(err as CallbackError)
    }
  }
)

export default mongoose.model<IRestaurant>("Restaurant", RestaurantSchema)
