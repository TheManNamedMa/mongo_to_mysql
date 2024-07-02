import {
	migrateAccounts,
	migrateChains,
	migrateContracts,
	migrateTBlocks,
	migrateEntity,
	migrateExecute,
	migrateFileKey,
	migrateMonitor,
	migrateNode,
	migrateDBlock,
	migratePresetContract,
	migrateProtocol,
	migrateRootKey
} from "./models"

import { connectDatabase, disconnectDatabase, connectMySql, disconnectMySql } from "./connection";


const main = async () => {
	await connectDatabase()
	await connectMySql()

	console.log('migrate start');
	await migrateAccounts()
	await migrateChains()
	await migrateTBlocks()
	await migrateContracts()
	await migrateEntity()
	await migrateExecute()
	await migrateFileKey()
	await migrateMonitor()
	await migrateNode()
	await migrateDBlock()
	await migratePresetContract()
	await migrateProtocol()
	await migrateRootKey()
	console.log('migrate finish');

	await disconnectDatabase()
	await disconnectMySql()
	console.log('finish');
	// process.exit(1)
}

main()

