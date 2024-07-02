import { Document, model, Schema } from 'mongoose'
import { Table } from './table';
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	TEXT,
	Op,
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 2000

const tableName = "rootkeys"

type RootKeyType = {
	_id?: string
	publicKey: string
	jsonKey: string
}


export type RootKeyDocument = Document & RootKeyType

const executeSchema = new Schema(
	{
		publicKey: String,
		jsonKey: String
	},
	{ timestamps: true, versionKey: false }
)

export const RootKeyMongoModel = model<RootKeyDocument>(Table.RootKey, executeSchema)



export interface RootKeyMySqlType
	extends Model<
		InferAttributes<RootKeyMySqlType>,
		InferCreationAttributes<RootKeyMySqlType>
	>,
	RootKeyType { }


export const RootKeyMySqlModel = mySqlConnection.define<RootKeyMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(255),
			allowNull: false
		},
		publicKey: {
			type: STRING(255),
			allowNull: true,
		},
		jsonKey: {
			type: TEXT('medium'),
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
	const contracts = await RootKeyMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await RootKeyMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

const asyncManyOperation = async (list: any) => {
	const results = await RootKeyMySqlModel.bulkCreate(list);
	return results;
};



async function updateSequentially(updateList: RootKeyMySqlType[]) {
	for (const item of updateList) {
		console.log('update root key', item._id);
		await updateOperation(item);
	}
}


export async function migrateRootKey() {
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
		const newList: RootKeyMySqlType[] = []
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

		const preList = await RootKeyMySqlModel.findAll({
			where: {
				_id: {
					[Op.in]: _ids,
				},
			},
		});
		if (!preList.length) {
			await asyncManyOperation(newList)
		} else {
			const insertList: RootKeyMySqlType[] = [];
			const updateList: RootKeyMySqlType[] = [];

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
