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
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 50

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
	ExecuteType { }


export const ExecuteMySqlModel = mySqlConnection.define<ExecuteMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(255),
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
		}
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

function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await ExecuteMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

const asyncManyOperation = async (list: any) => {
	const results = await ExecuteMySqlModel.bulkCreate(list);
	return results;
};



async function updateSequentially(updateList: ExecuteMySqlType[]) {
	for (const item of updateList) {
		console.log('updateSequentially', item._id);
		await updateOperation(item);
	}
}


export async function migrateExecute() {
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

		const preList = await ExecuteMySqlModel.findAll({
			where: {
				_id: {
					[Op.in]: _ids,
				},
			},
		});
		if (!preList.length) {
			await asyncManyOperation(newList)
		} else {
			const insertList: ExecuteMySqlType[] = [];
			const updateList: ExecuteMySqlType[] = [];

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
