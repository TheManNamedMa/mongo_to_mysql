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
	BOOLEAN,
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 2000

const tableName = "nodes"

type NodeType = {
	_id?: string
	nodeId: string
	nodeType: number
	activateStatus: number
	chainId: number
	name: string
	description: string
	host: string
	port: number
	location: string
	latitude: number
	longitude: number
	regionName: string
	isDictatorship: boolean
	address: string
	passportName: string
}


export type NodeDocument = Document & NodeType

const executeSchema = new Schema(
	{
		nodeId: {
			type: String,
			unique: true,
			index: true
		},
		nodeType: Number,
		activateStatus: Number,
		chainId: {
			type: Number,
			index: true
		},
		name: String,
		description: String,
		host: String,
		port: Number,
		location: String,
		latitude: Number,
		longitude: Number,
		regionName: String,
		isDictatorship: Boolean,
		address: String,
		passportName: String
	},
	{ timestamps: true, versionKey: false }
)

export const NodeMongoModel = model<NodeDocument>(Table.Node, executeSchema)



export interface NodeMySqlType
	extends Model<
		InferAttributes<NodeMySqlType>,
		InferCreationAttributes<NodeMySqlType>
	>,
	NodeType { }


export const NodeMySqlModel = mySqlConnection.define<NodeMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(255),
			allowNull: false
		},
		nodeId: {
			type: STRING(255),
			allowNull: true,
		},
		nodeType: {
			type: INTEGER,
			allowNull: true,
		},
		activateStatus: {
			type: INTEGER,
			allowNull: true,
		},
		chainId: {
			type: INTEGER,
			allowNull: true,
		},
		name: {
			type: STRING(255),
			allowNull: true,
		},
		description: {
			type: STRING(512),
			allowNull: true,
		},
		host: {
			type: STRING,
			allowNull: true,
		},
		port: {
			type: INTEGER,
		},
		location: {
			type: STRING,
			allowNull: true,
		},
		latitude: {
			type: FLOAT,
			allowNull: true,
		},
		longitude: {
			type: FLOAT,
			allowNull: true,
		},
		regionName: {
			type: STRING(255),
			allowNull: true,
		},
		isDictatorship: {
			type: BOOLEAN,
			allowNull: true,
		},
		address: {
			type: STRING,
			allowNull: true,
		},
		passportName: {
			type: STRING,
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
	const contracts = await NodeMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await NodeMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

const asyncManyOperation = async (list: any) => {
	const results = await NodeMySqlModel.bulkCreate(list);
	return results;
};



async function updateSequentially(updateList: NodeMySqlType[]) {
	for (const item of updateList) {
		console.log('update node', item._id);
		await updateOperation(item);
	}
}


export async function migrateNode() {
	// 同步数据库
	await mySqlConnection.sync({ force: false });

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
		const newList: NodeMySqlType[] = []
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

		const preList = await NodeMySqlModel.findAll({
			where: {
				_id: {
					[Op.in]: _ids,
				},
			},
		});
		if (!preList.length) {
			await asyncManyOperation(newList)
		} else {
			const insertList: NodeMySqlType[] = [];
			const updateList: NodeMySqlType[] = [];

			newList.forEach((item: any) => {
				const id = item._id;
				if (!_idSet.has(id)) {
					insertList.push(item);
				} else {
					updateList.push(item);
				}
			});

			if (insertList.length) {
				await asyncManyOperation(insertList)
			}
			if (updateList.length) {

				await updateSequentially(updateList);
			}
		}
		lastId = list[list.length - 1]._id;
		console.log(`${tableName} ${current += list.length} ${lastId}`)
	}



	// 等待所有异步操作完成
}
