import {
	// migrateAccounts,
	// migrateChains,
	// migrateContracts,
	migrateTBlocks,
	migrateEntity,
	migrateExecute,
	migrateFileKey,
	migrateMonitor
} from "./models"

import { connectDatabase, disconnectDatabase, connectMySql, disconnectMySql } from "./connection";


const main = async () => {
	await connectDatabase()
	await connectMySql()

	console.log('migrate start');
	// await migrateChains()
	// await migrateAccounts()
	// await migrateTBlocks()
	// await migrateContracts()
	// await migrateEntity()
	// await migrateExecute()
	// await migrateFileKey()
	await migrateMonitor()
	console.log('migrate finish');

	await disconnectDatabase()
	await disconnectMySql()
	console.log('finish');
	// process.exit(1)
}

main()

