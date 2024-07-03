import { Document, model, SchemaTypes, Schema, Types } from 'mongoose'
import { Table } from './table';
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	TEXT,
	FLOAT,
	Op,
	BIGINT,
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 2000

const tableName = "monitors"

type MonitorType = {
	_id?: string
	chainId: number
	nodeId: string
	cpuUsedPercent: number
	memoryUsedPercent: number
	netReceivedBytes: number
	netSentBytes: number
	diskUsedPercent: number
	tps: number
	timestamp: number
}


export type MonitorDocument = Document & MonitorType

const executeSchema = new Schema(
	{
		chainId: {
			type: Number,
			index: true
		},
		nodeId: String,
		cpuUsedPercent: Number,
		memoryUsedPercent: Number,
		netReceivedBytes: {
			type: Number,
			default: 0
		},
		netSentBytes: {
			type: Number,
			default: 0
		},
		diskUsedPercent: Number,
		tps: Number,
		timestamp: Number
	},
	{ timestamps: true, versionKey: false }
)

export const MonitorMongoModel = model<MonitorDocument>(Table.Monitor, executeSchema)



export interface MonitorMySqlType
	extends Model<
		InferAttributes<MonitorMySqlType>,
		InferCreationAttributes<MonitorMySqlType>
	>,
	MonitorType { }


export const MonitorMySqlModel = mySqlConnection.define<MonitorMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		nodeId: {
			type: STRING(255),
			allowNull: true,
		},
		chainId: {
			type: INTEGER,
			allowNull: true,
		},
		cpuUsedPercent: {
			type: FLOAT,
			allowNull: true,
		},
		memoryUsedPercent: {
			type: FLOAT,
			allowNull: true,
		},
		netSentBytes: {
			type: BIGINT,
			allowNull: true,
		},
		netReceivedBytes: {
			type: BIGINT,
			allowNull: true,
		},
		diskUsedPercent: {
			type: FLOAT,
			allowNull: true,
		},
		tps: {
			type: INTEGER,
			allowNull: true,
		},
		timestamp: {
			type: BIGINT,
			allowNull: true,
		}
	},
	{
		tableName: tableName, // 指定表名
		timestamps: false, // 禁用自动添加的时间戳字段
		modelName: tableName,
	}
)


const getMongoData = async (query: any): Promise<any[]> => {
	const contracts = await MonitorMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};


const asyncManyOperation = async (list: any) => {
	const results = await MonitorMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"nodeId",
			"chainId",
			"cpuUsedPercent",
			"memoryUsedPercent",
			"netSentBytes",
			"netReceivedBytes",
			"diskUsedPercent",
			"tps",
			"timestamp",
		],
	});
	return results;
};



export async function migrateMonitor() {



	let lastId = null

	let current = 0
	while (true) {
		const query: any = lastId ? { _id: { $gt: lastId } } : {};
		const list = (await getMongoData(query)) || [];
		if (list.length === 0) {
			break;
		}

		const _idSet = new Set();
		const _ids: string[] = [];
		const newList: MonitorMySqlType[] = []
		list.forEach((data: any) => {
			const { _doc } = data;
			const { _id, ...item } = _doc;
			const id = _id.toHexString();
			_idSet.add(id)
			_ids.push(id)
			const newItem = {
				_id: id,
				...item,
			};
			newList.push(newItem)
		});

		await asyncManyOperation(newList)

		lastId = list[list.length - 1]._id;
		console.log(`${tableName} ${current += list.length} ${lastId}`)
	}



	// 等待所有异步操作完成
}
