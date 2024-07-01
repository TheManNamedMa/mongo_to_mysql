import { Sequelize } from "sequelize";

import { dbName, mysqlPort, mysqlUrl, mysqlUser, mysqlPassword } from "../config";

// const mySqlConnection = createConnection({
// 	host: mysqlUrl,
// 	port: mysqlPort,
// 	database: dbName,
// 	user: mysqlUser,
// 	password: mysqlPassword,
// });

// mySqlConnection.connect((err) => {
// 	if (err) throw err;
// 	console.log('Connected to MySQL');
// });

// // 断开链接
// const disconnectMySql = () => {
// 	mySqlConnection.end((err) => {
// 		if (err) throw err;
// 		console.log('Disconnected from MySQL');
// 	});
// };

// 	host: mysqlUrl,
// 	port: mysqlPort,
// 	database: dbName,
// 	user: mysqlUser,
// 	password: mysqlPassword,
const mySqlConnection = new Sequelize(dbName, mysqlUser, mysqlPassword, {
	host: mysqlUrl,
	dialect: "mysql",
	port: mysqlPort,
});

const connectMySql = async () => {
	try {
		await mySqlConnection.authenticate();
		console.log("Connection has been established successfully.");
	} catch (error) {
		console.error("Unable to connect to the post:", error);
	}
};

const disconnectMySql = async () => {
	await mySqlConnection.close();
	console.log("Disconnected from MySQL");
};


export { mySqlConnection, connectMySql, disconnectMySql };

