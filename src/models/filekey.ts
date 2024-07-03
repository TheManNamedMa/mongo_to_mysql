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

const batchSize = 200

const tableName = "fileKeys"

type FileKeyType = {
	_id?: string
	address: string
	filekey: string
	privateKey?: string
	linker?: string
}


export type FileKeyDocument = Document & FileKeyType

const executeSchema = new Schema(
	{
		address: String,
		filekey: String,
		privateKey: String,
		linker: String
	},
	{ timestamps: true, versionKey: false }
)

export const FileKeyMongoModel = model<FileKeyDocument>(Table.Filekey, executeSchema)



export interface FileKeyMySqlType
	extends Model<
		InferAttributes<FileKeyMySqlType>,
		InferCreationAttributes<FileKeyMySqlType>
	>,
	FileKeyType { }


export const FileKeyMySqlModel = mySqlConnection.define<FileKeyMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		address: {
			type: STRING,
			allowNull: true,
		},
		filekey: {
			type: TEXT("medium"),
			allowNull: true,
		},
		privateKey: {
			type: STRING,
			allowNull: true,
		},
		linker: {
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
	const contracts = await FileKeyMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

const asyncManyOperation = async (list: any) => {
	const results = await FileKeyMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"address",
			"filekey",
			"privateKey",
			"linker",
		],
	});
	return results;
};



export async function migrateFileKey() {



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
		const newList: FileKeyMySqlType[] = []
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
