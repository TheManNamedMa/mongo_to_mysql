import { mySqlConnection } from "../connection";
import { Table } from './table'
import { Document, model, Schema } from 'mongoose'
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
} from "sequelize";

const tableName = "chains"
type Chain = {
	chainId: number;
	dblockInterval?: number;
	_id?: string
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
	extends Model<InferAttributes<ChainMySqlType>, InferCreationAttributes<ChainMySqlType>>, Chain { }
// 定义模型
export const ChainMySqlModel = mySqlConnection.define<ChainMySqlType>(
	tableName,
	{
		_id: {
			type: STRING,
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
	}
);


function asyncOperation(data: any) {
	return new Promise(async (resolve) => {
		const { _doc } = data
		const { _id, ...item } = _doc
		const id = _id.toHexString()
		const preInfo = await ChainMySqlModel.findOne({ where: { _id: id } })
		const newItem = {
			_id: id,
			...item
		}
		if (!preInfo) {
			await ChainMySqlModel.create(newItem)
		} else {
			await ChainMySqlModel.update(newItem, {
				where: {
					_id: id,
				}
			})
		}
		resolve({});
	});
}



const getMongoChains = async () => {
	const chains = await ChainMongoModel.find()
	return chains
}

// 迁移链数据库
export async function migrateChains() {
	const list = await getMongoChains() || []
	// 同步数据库
	await mySqlConnection.sync({ force: false })

	const promises = list.map(async (item) => {
		return await asyncOperation(item);
	});

	// 等待所有异步操作完成
	const results = await Promise.all(promises);
}



