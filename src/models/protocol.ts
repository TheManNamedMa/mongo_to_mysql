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
	ARRAY,
	DATE,
} from "sequelize";
import { mySqlConnection } from "../connection";
import { migrateConfig } from "../config";

const { protocol } = migrateConfig;

const { batchSize, startId } = protocol

const tableName = "protocols"

type ProtocolType = {
	_id?: string
	hash: string
	uri: string
	suit: number
	title: string
	bytes: number[]
	nodeId: string
	chainId: number
}


export type ProtocolDocument = Document & ProtocolType

const executeSchema = new Schema(
	{
		hash: String,
		uri: String,
		suit: Number,
		title: String,
		bytes: [Number],
		nodeId: String,
		chainId: { type: Number, index: true }
	},
	{ timestamps: true, versionKey: false }
)

export const ProtocolMongoModel = model<ProtocolDocument>(Table.Protocol, executeSchema)



export interface ProtocolMySqlType
	extends Model<
		InferAttributes<ProtocolMySqlType>,
		InferCreationAttributes<ProtocolMySqlType>
	>,
	ProtocolType {
	createdAt: Date;
	updatedAt: Date;
}


export const ProtocolMySqlModel = mySqlConnection.define<ProtocolMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		hash: {
			type: STRING(255),
			allowNull: true,
		},
		uri: {
			type: STRING,
			allowNull: true,
		},
		suit: {
			type: STRING,
			allowNull: true,
		},
		title: {
			type: STRING,
			allowNull: true,
		},
		bytes: {
			// type: ARRAY(INTEGER),
			allowNull: true,
			type: TEXT("long"),
			get() {
				const value = (this.getDataValue("bytes") ||
					JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: any = JSON.stringify(value);
				this.setDataValue("bytes", v);
			},
		},
		nodeId: {
			type: STRING,
			allowNull: true,
		},
		chainId: {
			type: INTEGER,
			allowNull: true,
		},
		createdAt: {
			allowNull: true,
			type: DATE,
		},
		updatedAt: {
			allowNull: true,
			type: DATE,
		},
	},
	{
		tableName: tableName, // 指定表名
		timestamps: false, // 禁用自动添加的时间戳字段
		modelName: tableName,
	}
)


const getMongoData = async (query: any): Promise<any[]> => {
	const contracts = await ProtocolMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await ProtocolMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

const asyncManyOperation = async (list: any) => {
	const results = await ProtocolMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"hash",
			"uri",
			"suit",
			"title",
			"bytes",
			"nodeId",
			"chainId",
			"createdAt",
			"updatedAt"
		],
	});
	return results;
};




export async function migrateProtocol() {

	let lastId = startId
	let current = 0
	while (true) {
		const query: any = lastId ? { _id: { $gt: lastId } } : {};
		const list = (await getMongoData(query)) || [];
		if (list.length === 0) {
			break;
		}

		const _idSet = new Set();
		const _ids: string[] = [];
		const newList: ProtocolMySqlType[] = []
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

		// const preList = await ProtocolMySqlModel.findAll({
		// 	where: {
		// 		_id: {
		// 			[Op.in]: _ids,
		// 		},
		// 	},
		// });
		// if (!preList.length) {
		// } else {
		// 	const insertList: ProtocolMySqlType[] = [];
		// 	const updateList: ProtocolMySqlType[] = [];

		// 	newList.forEach((item: any) => {
		// 		const id = item._id;
		// 		if (!_idSet.has(id)) {
		// 			insertList.push(item);
		// 		} else {
		// 			updateList.push(item);
		// 		}
		// 	});

		// 	if (insertList.length) {
		// 		await asyncManyOperation(insertList)
		// 	}
		// 	if (updateList.length) {

		// 		await updateSequentially(updateList);
		// 	}
		// }
		lastId = list[list.length - 1]._id;
		console.log(`${tableName} ${current += list.length} ${lastId}`)
	}



	// 等待所有异步操作完成
}
