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
	_id?: String,
	dataId: String
	businessAddr: String
	hash: String
	uri: String
	ID?: String
	bytes: number[]
	nodeId: String
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
			type: STRING(32),
			unique: true,
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
	const results = await EntityMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"dataId",
			"businessAddr",
			"hash",
			"uri",
			"entityID",
			"bytes",
			"nodeId",
			"chainId",
		]
	});
	return results;
};




export async function migrateEntity() {



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

		await asyncManyOperation(newList)

		lastId = list[list.length - 1]._id;
		console.log(`${tableName} ${current += list.length} ${lastId}`)
	}



	// 等待所有异步操作完成
}
