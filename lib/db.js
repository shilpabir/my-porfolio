import mongoose from "mongoose";
import "dotenv/config.js";
const uri =
  process.env.MONGODB_URI 
  // || "mongodb+srv://shilpalamba19_db_user:QLUSSBvJAa0AvkyE@cluster0.ernfxws.mongodb.net/test?appName=Cluster0";

let cached = globalThis.mongooseConnection;
if (!cached) {
  cached = globalThis.mongooseConnection = { connection: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.connection) return cached.connection;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((instance) => instance)
      .catch((error) => {
        cached.promise = null;
        throw new Error(`Unable to connect to MongoDB: ${error.message}`);
      });
  }
  cached.connection = await cached.promise;
  return cached.connection;
}
 