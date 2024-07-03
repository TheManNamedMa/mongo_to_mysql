import { Document, model, SchemaTypes, Schema, Types } from 'mongoose'
import { Table } from './table';
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	BIGINT,
	TEXT,
	Op,
	DATE,
} from "sequelize";
import { mySqlConnection } from "../connection";
import { migrateConfig } from "../config";

const { execute } = migrateConfig;

const { batchSize, startId } = execute


const tableName = "executes"

type ExecuteType = {
	_id?: string
	chainId: number
	nodeId: string
	bytecode: string
	account: string
	address: string
	methodName: string
	_arguments: unknown[]
	timestamp: number
	result: string
	hash: string
	joule: number
	tblock: Types.ObjectId
}


export type ExecuteDocument = Document & ExecuteType

const executeSchema = new Schema(

	{
		chainId: {
			type: Number,
			index: true
		},
		nodeId: String,
		bytecode: String,
		account: String,
		address: String,
		methodName: {
			type: String,
			default: null
		},
		timestamp: Number,
		_arguments: [Object],
		result: String,
		hash: {
			type: String,
			unique: true
		},
		joule: {
			type: Number,
			default: 0
		},
		tblock: {
			type: SchemaTypes.ObjectId,
			ref: Table.TBlock
		}
	},
	{ timestamps: true, versionKey: false }
)

export const ExecuteMongoModel = model<ExecuteDocument>(Table.Execute, executeSchema)



export interface ExecuteMySqlType
	extends Model<
		InferAttributes<ExecuteMySqlType>,
		InferCreationAttributes<ExecuteMySqlType>
	>,
	ExecuteType {
	createdAt: Date;
	updatedAt: Date;
}


export const ExecuteMySqlModel = mySqlConnection.define<ExecuteMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		chainId: {
			type: INTEGER,
			allowNull: true,
		},
		nodeId: {
			type: STRING,
			allowNull: true,
		},
		bytecode: {
			type: TEXT("long"),
			allowNull: true,
		},
		account: {
			type: STRING,
			allowNull: true,
		},
		address: {
			type: STRING,
			allowNull: true,
		},
		methodName: {
			type: STRING,
			allowNull: true,
		},
		timestamp: {
			type: BIGINT,
			allowNull: true,
		},
		_arguments: {
			allowNull: true,
			type: TEXT("long"),
			get() {
				const value = (this.getDataValue("_arguments") ||
					JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: unknown[] = JSON.stringify(value) as unknown as unknown[];
				this.setDataValue("_arguments", v);
			},
		},
		result: {
			type: TEXT("long"),
			allowNull: true,
		},
		hash: {
			type: STRING,
			allowNull: true,
		},
		joule: {
			type: BIGINT,
			allowNull: true,
			defaultValue: 0
		},
		tblock: {
			type: STRING,
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
	const contracts = await ExecuteMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

const asyncManyOperation = async (list: any) => {
	const results = await ExecuteMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"chainId",
			"nodeId",
			"bytecode",
			"account",
			"address",
			"methodName",
			"timestamp",
			"_arguments",
			"result",
			"hash",
			"joule",
			"tblock",
			"createdAt",
			"updatedAt"
		],
	});
	return results;
};




export async function migrateExecute() {



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
		const newList: ExecuteMySqlType[] = []
		list.forEach((data: any) => {
			const { _doc } = data;
			const { _id, tblock: _tblock, ...item } = _doc;
			const id = _id.toHexString();
			const tblock = _tblock?.toHexString();
			_idSet.add(id)
			_ids.push(id)
			const newItem = {
				_id: id,
				tblock,
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
