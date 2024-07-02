import { mySqlConnection } from "../connection";
import { Table } from './table'
import { Document, model, Schema } from 'mongoose'
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	DataTypes,
} from "sequelize";

type AccountsType = {
	chainId: number,
	address: string,
	_id?: string
}

const tableName = "accounts"

export type AccountsDocument = Document & AccountsType

const accountsSchema = new Schema(
	{
		chainId: {
			type: Number,
			index: true,
			unique: true
		},
		address: {
			type: String
		}
	},
	{ versionKey: false }
)

export const AccountMongoModel = model<AccountsDocument>(Table.Account, accountsSchema)




export interface AccountsMySqlType
	extends Model<InferAttributes<AccountsMySqlType>, InferCreationAttributes<AccountsMySqlType>>, AccountsType { }
// 定义模型
export const AccountsMySqlModel = mySqlConnection.define<AccountsMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(255),
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
	}
);


function asyncOperation(data: any) {
	return new Promise(async (resolve) => {
		const { _doc } = data
		const { _id, ...item } = _doc
		const id = _id.toHexString()
		const preInfo = await AccountsMySqlModel.findOne({ where: { _id: id } })
		const newItem = {
			_id: id,
			...item
		}

		if (!preInfo) {
			await AccountsMySqlModel.create(newItem)
		} else {
			await AccountsMySqlModel.update(newItem, {
				where: {
					_id: id,
				}
			})
		}
		resolve({});
	});
}


const getMongoAccounts = async () => {
	const accounts = await AccountMongoModel.find()
	return accounts
}

// 迁移链数据库
export async function migrateAccounts() {
	const list = await getMongoAccounts() || []
	// 同步数据库
	await mySqlConnection.sync({ force: false })

	const promises = list.map(async (item) => {
		return await asyncOperation(item);
	});

	// 等待所有异步操作完成
	const results = await Promise.all(promises);


	return Promise.resolve()
}



