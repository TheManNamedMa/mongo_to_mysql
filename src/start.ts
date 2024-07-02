import {
	// migrateAccounts,
	// migrateChains,
	// migrateContracts,
	migrateTBlocks,
	migrateEntity
} from "./models"

import { connectDatabase, disconnectDatabase, connectMySql, disconnectMySql } from "./connection";


const main = async () => {
	await connectDatabase()
	await connectMySql()

	console.log('migrate start');
	// await migrateChains()
	// await migrateAccounts()
	await migrateTBlocks()
	// await migrateContracts()
	await migrateEntity()
	console.log('migrate finish');

	await disconnectDatabase()
	await disconnectMySql()
	console.log('finish');
	// process.exit(1)
}

main()

