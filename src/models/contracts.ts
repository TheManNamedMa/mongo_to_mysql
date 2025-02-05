import { TBlockMySqlModel } from "./";
import { mySqlConnection } from "../connection";
import { Table } from './table'
import { Document, model, Schema, SchemaTypes, Types } from 'mongoose'
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	BOOLEAN,
	DATE,
	DataTypes,
} from "sequelize";


const tableName = "contracts"
export interface Contract {
	chainId: number
	nodeId: string
	internal: boolean
	isPreset: boolean // 链上预置合约
	account: string
	name: string
	abi: string
	bytecode: string
	fileName: string
	address: string
	hash: string
	joule: number
	tblock: Types.ObjectId
	status: number // 0暂存，1成功，2失败
	lifecycle: number // 0已吊销 1正常 2已冻结 3部署中 4升级中 5冻结中 6解冻中 7吊销中 8 已拒绝
	isBanned: boolean // 是否封禁
	isPublished: boolean // 是否发布
	isProtected: boolean // 预置合约，无法在BaaS中直接调用
	publishedAt: Date
	editedAt: Date
	version: string
	language: string
	description: string
	sourceCodeUrl: string
	_arguments: unknown[]
}

export type ContractDocument = Document & Contract

const contractSchema = new Schema(
	{
		chainId: {
			type: Number,
			index: true
		},
		nodeId: String,
		internal: {
			type: Boolean,
			default: false
		},
		isPreset: {
			type: Boolean,
			default: false
		},
		account: String,
		name: String,
		abi: String,
		bytecode: String,
		fileName: String,
		address: String,
		hash: String,
		joule: { type: Number, default: 0 },
		tblock: {
			type: SchemaTypes.ObjectId,
			ref: Table.TBlock
		},
		status: {
			type: Number,
			default: 1
		},
		lifecycle: {
			type: Number,
			default: 1
		},
		isBanned: {
			type: Boolean,
			default: false
		},
		isPublished: {
			type: Boolean,
			default: true
		},
		publishedAt: { type: Date, default: null },
		editedAt: { type: Date, default: null },
		isProtected: { type: Boolean, default: false },
		language: { type: String, default: 'solidity' },
		description: { type: String, default: null },
		sourceCodeUrl: { type: String, default: null },
		version: {
			type: String,
			default: '1.0'
		},
		_arguments: {
			type: Array,
			default: []
		}
	},
	{ timestamps: true, versionKey: false }
)

const ContractMongoModel = model<ContractDocument>(Table.Contract, contractSchema)




export interface ContractsMySqlType extends Model<InferAttributes<ContractsMySqlType>, InferCreationAttributes<ContractsMySqlType>>, Contract { }
// 定义模型
export const ContractsMySqlModel = mySqlConnection.define<ContractsMySqlType>(
	tableName,
	{
		chainId: {
			type: INTEGER,
			allowNull: true,
		},
		nodeId: {
			type: STRING, // 假设nodeId应该是字符串类型
			allowNull: true, // 允许为空
		},
		internal: {
			type: BOOLEAN,
			allowNull: true,
			defaultValue: false
		},
		isPreset: {
			type: BOOLEAN,
			allowNull: true,
		},
		account: {
			type: STRING,
			allowNull: true,
		},
		name: {
			type: STRING,
			allowNull: true,
		},
		abi: {
			type: STRING,
			allowNull: true,
		},
		bytecode: {
			type: STRING,
			allowNull: true,
		},
		fileName: {
			type: STRING,
			allowNull: true,
		},
		address: {
			type: STRING,
			allowNull: true,
		},
		hash: {
			type: STRING,
			allowNull: true,
		},
		joule: {
			type: INTEGER, // 假设joule应该是数字类型
			allowNull: true,
			defaultValue: 0,
		},
		tblock: {
			type: STRING, // 假设tblock应该是数字类型
			allowNull: true,
			references: {
				model: TBlockMySqlModel,
				key: '_id',
			}
		},
		status: {
			type: INTEGER,
			allowNull: true,
			defaultValue: 1,
		},
		lifecycle: {
			type: INTEGER,
			allowNull: true,
			defaultValue: 1,
		},
		isBanned: {
			type: BOOLEAN,
			allowNull: true,
			defaultValue: false,
		},
		isPublished: {
			allowNull: true,
			type: BOOLEAN,
			defaultValue: true
		}, publishedAt: {
			allowNull: true,
			type: DATE,
		},
		isProtected: {
			type: BOOLEAN,
			allowNull: true,
			defaultValue: true
		}, language: {
			allowNull: true,
			type: STRING,
		}, description: {
			allowNull: true,
			type: STRING,
		}, sourceCodeUrl: {
			allowNull: true,
			type: STRING,
		},
		editedAt: {
			allowNull: true,
			type: DATE,
		}, version: {
			allowNull: true,
			type: STRING,
		}, _arguments: {
			allowNull: true,
			type: DataTypes.TEXT,
			get() {
				const value = (this.getDataValue('_arguments') || JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: unknown[] = JSON.stringify(value) as unknown as unknown[];
				this.setDataValue('_arguments', v);
			}
		}
	},
	{
		tableName: tableName, // 指定表名
		timestamps: false, // 禁用自动添加的时间戳字段
	}
);



const getMongoContracts = async () => {
	const contracts = await ContractMongoModel.find()
	return contracts
}

// 迁移链数据库
export async function migrateContracts() {
	const list = await getMongoContracts() || []
	// 同步数据库
	await mySqlConnection.sync({ force: false })

	list.forEach(async ({ _doc }: any) => {
		const { _id, ...item } = _doc
		if (item.tblock) {
			console.dir(item);
		}
		// const chainInfo = await ContractsMySqlModel.findOne({ where: { ...item } })

		// if (!chainInfo) {
		// 	await ContractsMySqlModel.create(item)
		// } else {
		// 	await ContractsMySqlModel.update(item, {
		// 		where: {
		// 			...item
		// 		}
		// 	})
		// }
	})
	return Promise.resolve()
}



