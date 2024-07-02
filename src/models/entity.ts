import { Document, model, Schema } from 'mongoose'
import { Table } from './table';
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	BOOLEAN,
	DataTypes,
	BIGINT,
	TEXT,
	Op,
} from "sequelize";
import { mySqlConnection } from "../connection";

import { batchSize } from "../config";

const tableName = "entities"

type EntityType = {
	_id: String,
	dataId: string
	businessAddr: string
	hash: string
	uri: string
	ID: string
	bytes: number[]
	nodeId: string
	chainId: number
}


export type EntityDocument = Document & EntityType

const entitySchema = new Schema(
	{
		dataId: String,
		businessAddr: String,
		hash: String,
		uri: String,
		ID: String,
		bytes: [Number],
		nodeId: String,
		chainId: Number
	},
	{ timestamps: true, versionKey: false }
)

export const EntityMongoModel = model<EntityDocument>(Table.Entity, entitySchema)



export interface EntityMySqlType
	extends Model<
		InferAttributes<EntityMySqlType>,
		InferCreationAttributes<EntityMySqlType>
	>,
	Omit<EntityType, "ID"> {
	entityID?: string
}


export const EntityMySqlModel = mySqlConnection.define<EntityMySqlType>(
	tableName,
	{
		_id: {
			type: STRING,
			allowNull: true,
		},
		dataId: {
			type: STRING,
			allowNull: true,
		},
		businessAddr: {
			type: STRING,
			allowNull: true,
		},
		hash: {
			type: STRING,
			allowNull: true,
		},
		uri: {
			type: STRING,
			allowNull: true,
		},
		entityID: {
			type: STRING,
			allowNull: true,
		},
		bytes: {
			type: DataTypes.BLOB,
			allowNull: true,
		},
		nodeId: {
			type: STRING,
			allowNull: true,
		},
		chainId: {
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
	const contracts = await EntityMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await EntityMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

const asyncManyOperation = async (list: any) => {
	const results = await EntityMySqlModel.bulkCreate(list);
	return results;
};



async function updateSequentially(updateList: EntityMySqlType[]) {
	for (const item of updateList) {
		console.log('updateSequentially', item._id);
		await updateOperation(item);
	}
}


export async function migrateEntity() {
	// 同步数据库
	await mySqlConnection.sync({ force: false });

	let lastId = null

	while (true) {
		const query: any = lastId ? { _id: { $gt: lastId } } : {};
		const list = (await getMongoData(query)) || [];
		if (list.length === 0) {
			break;
		}

		const _idSet = new Set();
		const _ids: string[] = [];
		const newList: EntityMySqlType[] = []
		list.forEach((data: any) => {
			const { _doc } = data;
			const { _id, ID, ...item } = _doc;
			const id = _id.toHexString();
			_idSet.add(id)
			_ids.push(id)
			const newItem = {
				_id: id,
				entityID: ID,
				...item,
			};
			newList.push(newItem)
		});

		const preList = await EntityMySqlModel.findAll({
			where: {
				_id: {
					[Op.in]: _ids,
				},
			},
		});
		if (!preList.length) {
			await asyncManyOperation(newList)
		} else {
			const insertList: EntityMySqlType[] = [];
			const updateList: EntityMySqlType[] = [];

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
	}



	// 等待所有异步操作完成
}
