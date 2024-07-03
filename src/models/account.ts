import { Document, model, SchemaTypes, Schema, Types } from 'mongoose'
import { Table } from './table';
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
} from "sequelize";
import { mySqlConnection } from "../connection";

import { migrateConfig } from "../config";

const { contracts } = migrateConfig;

const { batchSize, startId } = contracts


const tableName = "accounts"

type AccountsType = {
	_id?: string
	chainId: number,
	address: string,
}


export type AccountsDocument = Document & AccountsType

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

export const AccountMongoModel = model<AccountsDocument>(Table.Account, executeSchema)



export interface AccountsMySqlType
	extends Model<
		InferAttributes<AccountsMySqlType>,
		InferCreationAttributes<AccountsMySqlType>
	>,
	AccountsType { }


export const AccountsMySqlModel = mySqlConnection.define<AccountsMySqlType>(
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
		address: {
			type: STRING,
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
	const contracts = await AccountMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};


const asyncManyOperation = async (list: any) => {
	const results = await AccountsMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: ["chainId", "address"],
	});
	return results;
};


export async function migrateAccounts() {

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
		const newList: AccountsMySqlType[] = []
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
