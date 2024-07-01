import { TBlock } from '@latticelabs/sdk'
import { Document, model, Schema } from 'mongoose'
import { Table } from './table'
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	BOOLEAN,
	DATE,
	DataTypes,
	BIGINT,
	TEXT,
} from "sequelize";
import { mySqlConnection } from '../connection';


const tableName = "tblocks"


type TBlockType = TBlock & {
	chain: number;
	uploadType: 0;
	isAccepted: boolean;
	isHide: boolean
	_id?: string
}



type TBlockDocument = Document & TBlockType

const tblockSchema = new Schema(
	{
		chainId: {
			type: Number,
			index: true
		},
		amount: String,
		balance: String,
		code: String,
		codeHash: String,
		daemonHash: String,
		deposit: String,
		difficulty: Number,
		hash: {
			type: String,
			unique: true,
			required: true
		},
		hub: [String],
		income: String,
		joule: Number,
		linker: String,
		number: Number,
		owner: String,
		parentHash: String,
		payload: String,
		pow: String,
		record: Number,
		size: Number,
		timestamp: String,
		type: String,
		isAccepted: {
			type: Boolean,
			default: false
		},
		isHide: {
			type: Boolean,
			default: false
		}
	},
	{ versionKey: false }
)


const TBlockMongoModel = model<TBlockDocument>(Table.TBlock, tblockSchema)



export interface TBlockMySqlType extends Model<InferAttributes<TBlockMySqlType>, InferCreationAttributes<TBlockMySqlType>>, TBlockType { }
// 定义模型

export const TBlockMySqlModel = mySqlConnection.define<TBlockMySqlType>(
	tableName,
	{
		_id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		amount: {
			type: STRING,
			allowNull: true
		},
		balance: {
			type: STRING,
			allowNull: true
		},
		code: {
			type: TEXT,
			allowNull: true
		},
		codeHash: {
			type: STRING,
			allowNull: true
		},
		daemonHash: {
			type: STRING,
			allowNull: true
		},
		deposit: {
			type: STRING,
			allowNull: true
		},
		difficulty: {
			type: INTEGER,
			allowNull: true
		},
		hash: {
			type: STRING,
			allowNull: true
		},
		hub: {
			allowNull: true,
			type: DataTypes.TEXT,
			get() {
				const value = (this.getDataValue('hub') || JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: unknown[] = JSON.stringify(value) as unknown as unknown[];
				this.setDataValue('hub', v);
			}
		},
		income: {
			type: STRING,
			allowNull: true,
		},
		joule: {
			type: INTEGER, // 假设joule应该是数字类型
			allowNull: true,
			defaultValue: 0,
		},
		linker: {
			type: STRING,
			allowNull: true,
		},
		number: {
			type: INTEGER,
			allowNull: true,
		},
		owner: {
			type: STRING,
			allowNull: true,
		},
		parentHash: {
			type: STRING,
			allowNull: true,
		},
		payload: {
			type: STRING,
			allowNull: true,
		},
		pow: {
			type: STRING,
			allowNull: true,
		},
		record: {
			type: INTEGER,
			allowNull: true,
		},
		size: {
			type: INTEGER,
			allowNull: true,
		},
		timestamp: {
			type: BIGINT,
			allowNull: true,
		},
		type: {
			type: STRING,
			allowNull: true,
		},
		chain: {
			allowNull: true,
			type: INTEGER,
			defaultValue: true
		}, uploadType: {
			allowNull: true,
			type: INTEGER,
		},
		isAccepted: {
			type: BOOLEAN,
			allowNull: true,
		}, isHide: {
			allowNull: true,
			type: BOOLEAN,
		}
	},
	{
		tableName: tableName, // 指定表名
		timestamps: false, // 禁用自动添加的时间戳字段
	}
);



const getMongoTBlocks = async () => {
	const contracts = await TBlockMongoModel.find()
	return contracts
}


function asyncOperation(data: any) {
	return new Promise(async (resolve) => {

		const { _doc } = data
		const { _id, ...item } = _doc
		const id = _id.toHexString()
		const preInfo = await TBlockMySqlModel.findOne({ where: { _id: id } })
		const newItem = {
			_id: id,
			...item
		}
		if (!preInfo) {
			await TBlockMySqlModel.create(newItem)
		} else {
			await TBlockMySqlModel.update(newItem, {
				where: {
					_id: id,
				}
			})
		}
		resolve({});
	});
}


// 迁移链数据库
export async function migrateTBlocks() {
	const list = await getMongoTBlocks() || []
	// 同步数据库
	await mySqlConnection.sync({ force: false, })

	const promises = list.map(async (item) => {
		return await asyncOperation(item);
	});

	// 等待所有异步操作完成
	const results = await Promise.all(promises);

}



