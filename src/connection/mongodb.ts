
import mongoose from 'mongoose'
import { mongoUrl, mongoPassword, mongoUser, dbName } from "../config";

export const connectDatabase = async () => {
	// root:Lattice123@
	await mongoose
		.connect(`${mongoUrl}`, {
			dbName,
			user: mongoUser,
			pass: mongoPassword
		})
		.then(() => {
			/** ready to use. The `mongoose.connect()` promise resolves to undefined. */
			console.info('MongoDB connected')
		})
}


// 断开链接
export const disconnectDatabase = async () => {
	await mongoose.disconnect()

	console.log('disconnect mongodb')
}
