import mongoose from "mongoose";

// Store the state of the connection
const connection = { isConnected: undefined } as {
    isConnected: number | undefined;
};

export default async function connectMongo() {
    // Dont connect if already connected
    if (connection.isConnected) {
        return;
    }

    // Connect to the database
    const db = await mongoose.connect(process.env.MONGO_CONNECTION as string, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Get the state of the connection and log it
    connection.isConnected = db.connections[0].readyState;
    console.log(`MongoDB: ${connection.isConnected}`);
}
