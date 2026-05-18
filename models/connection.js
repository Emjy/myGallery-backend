const mongoose = require('mongoose');

const connectionString = process.env.CONNECTION_STRING;

let cached = global._mongoConnection;

if (!cached) {
    cached = global._mongoConnection = { conn: null, promise: null };
}

async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
    }

    cached.conn = await cached.promise;
    console.log('Database connected');
    return cached.conn;
}

connectDB().catch(error => console.error(error));