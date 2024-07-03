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

import { connectDatabase, disconnectDatabase, connectMySql, disconnectMySql, mySqlConnection } from "./connection";


import { migrateConfig } from "./config";

const main = async () => {
	await connectDatabase()
	await connectMySql()
	await mySqlConnection.sync({ force: false });
	console.log('migrate start');
	migrateConfig.accounts.migrate && await migrateAccounts()
	migrateConfig.chains.migrate && await migrateChains()
	migrateConfig.tBlocks.migrate && await migrateTBlocks()
	migrateConfig.contracts.migrate && await migrateContracts()
	migrateConfig.entity.migrate && await migrateEntity()
	migrateConfig.execute.migrate && await migrateExecute()
	migrateConfig.fileKey.migrate && await migrateFileKey()
	migrateConfig.monitor.migrate && await migrateMonitor()
	migrateConfig.node.migrate && await migrateNode()
	migrateConfig.dBlock.migrate && await migrateDBlock()
	migrateConfig.presetContract.migrate && await migratePresetContract()
	migrateConfig.protocol.migrate && await migrateProtocol()
	migrateConfig.rootKey.migrate && await migrateRootKey()
	console.log('migrate finish');

	await disconnectDatabase()
	await disconnectMySql()
	console.log('finish');
	// process.exit(1)
}

main()

