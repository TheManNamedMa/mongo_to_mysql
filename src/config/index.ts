// export const mongoUrl = "mongodb://127.0.0.1:27017";
// export const mongoUser = "";
// export const mongoPassword = "";
// export const mongoDbName = "lattice";



// export const mongoUrl = 'mongodb://172.22.1.112:27017';
// export const mongoUser = "root";
// export const mongoPassword = "Lattice123";
// export const mongoDbName = "lattice";


// export const mongoUrl = 'mongodb://172.22.1.20:27017';
// export const mongoUser = "";
// export const mongoPassword = "";
// export const mongoDbName = "lattice";

export const mongoUrl = 'mongodb://192.168.2.88:27017';
export const mongoUser = "root";
export const mongoPassword = "Lattice123";
export const mongoDbName = "lattice";

export const mysqlUrl = "localhost";
export const mysqlPort = 3306;
export const mysqlUser = "root";
export const mysqlPassword = "admin";
export const mysqlDbName = "lattice";



// export const mysqlUrl = "172.22.1.20";
// export const mysqlPort = 3306;
// export const mysqlUser = "root";
// export const mysqlPassword = "";
// export const mysqlDbName = "lattice";





const defaultBatchSize = 2000; // 大批量数据 分片尺寸

export const migrateConfig = {
	accounts: {
		batchSize: 100,
		migrate: true,
		startId: null,
	},
	chains: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
	tBlocks: {
		batchSize: 20,
		migrate: true,
		startId: null,
	},
	dBlock: {
		batchSize: 500,
		migrate: true,
		// startId: "6465c438c6203f964096b4f2"
		startId: null,
	},
	contracts: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
	presetContract: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
	entity: {
		batchSize: 100,
		migrate: true,
		startId: null,
	},
	rootKey: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
	node: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
	execute: {
		batchSize: 50,
		migrate: true,
		startId: null,
	},
	fileKey: {
		batchSize: 200,
		migrate: true,
		startId: null,
	},
	monitor: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
	protocol: {
		batchSize: defaultBatchSize,
		migrate: true,
		startId: null,
	},
}



