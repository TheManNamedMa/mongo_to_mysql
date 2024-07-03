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
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 2000

const tableName = "chains"

type Chain = {
	_id?: string
	chainId: number;
	dblockInterval?: number;
}

export type ChainDocument = Document & Chain


const chainSchema = new Schema(
	{
		chainId: {
			type: Number,
			index: true,
			unique: true
		},
		dblockInterval: {
			type: Number,
			allowNull: true
		}
	},
	{ versionKey: false }
)

export const ChainMongoModel = model<ChainDocument>(Table.Chain, chainSchema)



export interface ChainMySqlType
	extends Model<
		InferAttributes<ChainMySqlType>,
		InferCreationAttributes<ChainMySqlType>
	>,
	Chain { }


export const ChainMySqlModel = mySqlConnection.define<ChainMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		chainId: {
			type: INTEGER,
		},
		dblockInterval: {
			type: INTEGER,
			allowNull: true,
		},
	},
	{
		tableName: tableName, // 指定表名
		timestamps: false, // 禁用自动添加的时间戳字段
		modelName: tableName,
	}
)


const getMongoData = async (query: any): Promise<any[]> => {
	const contracts = await ChainMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

const asyncManyOperation = async (list: any) => {
	const results = await ChainMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: ["chainId", "dblockInterval"],
	});
	return results;
};




export async function migrateChains() {



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
		const newList: ChainMySqlType[] = []
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
