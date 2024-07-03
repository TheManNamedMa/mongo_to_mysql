import { Document, model, SchemaTypes, Schema, Types } from 'mongoose'
import { Table } from './table';
import { DBlock, Receipt, ZERO_HASH } from '@latticelabs/sdk'
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	TEXT,
	BIGINT,
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 500

const tableName = "dBlocks"

type DBlockType = DBlock & {
	_id?: string
	chainId: number;
	fromNow: string
}


export type DBlockDocument = Document & DBlockType

const receiptSchema = new Schema({
	contractAddress: String,
	contractRet: String,
	dblockHash: String,
	dblockNumber: Number,
	events: [Object],
	jouleUsed: Number,
	receiptIndex: Number,
	success: Boolean,
	tblockHash: {
		type: String,
		index: true
	}
})

const executeSchema = new Schema(
	{
		chainId: { type: Number, index: true },
		anchors: [Object],
		coinbase: String,
		contracts: [],
		difficulty: Number,
		extra: String,
		hash: {
			type: String,
			index: true,
			unique: true,
			required: true
		},
		ledgerHash: String,
		parentHash: String,
		pow: Number,
		receiptHash: String,
		receipts: [receiptSchema],
		signer: {
			type: String,
			default: ZERO_HASH
		},
		size: Number,
		td: Number,
		ttd: Number,
		number: Number,
		timestamp: Number
	},
	{ timestamps: true, versionKey: false }
)

export const DBlockMongoModel = model<DBlockDocument>(Table.DBlock, executeSchema)



export interface DBlockMySqlType
	extends Model<
		InferAttributes<DBlockMySqlType>,
		InferCreationAttributes<DBlockMySqlType>
	>,
	DBlockType { }


export const DBlockMySqlModel = mySqlConnection.define<DBlockMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		chainId: {
			type: INTEGER,
			allowNull: true,
		},
		anchors: {
			allowNull: true,
			type: TEXT("long"),
			get() {
				const value = (this.getDataValue("anchors") ||
					JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: unknown[] = JSON.stringify(value) as unknown as unknown[];
				this.setDataValue("anchors", v);
			},
		},
		coinbase: {
			type: STRING,
			allowNull: true,
		},
		contracts: {
			allowNull: true,
			type: TEXT("long"),
			get() {
				const value = (this.getDataValue("contracts") ||
					JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: unknown[] = JSON.stringify(value) as unknown as unknown[];
				this.setDataValue("contracts", v);
			},
		},
		difficulty: {
			type: INTEGER,
			allowNull: true,
		},
		extra: {
			type: TEXT("medium"),
			allowNull: true,
		},
		hash: {
			type: STRING,
			allowNull: true,
		},
		parentHash: {
			type: STRING,
		},
		ledgerHash: {
			type: STRING,
			allowNull: true,
		},
		pow: {
			type: INTEGER,
			allowNull: true,
		},
		receiptHash: {
			type: STRING,
			allowNull: true,
		},
		receipts: {
			type: TEXT("long"),
			allowNull: true,
			get() {
				const value = (this.getDataValue("receipts") ||
					JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: Receipt[] = JSON.stringify(value) as unknown as Receipt[];
				this.setDataValue("receipts", v);
			},
		},
		signer: {
			type: STRING,
			allowNull: true,
			defaultValue: ZERO_HASH
		},
		size: {
			type: INTEGER,
			allowNull: true,
		},
		td: {
			type: INTEGER,
			allowNull: true,
		},
		ttd: {
			type: INTEGER,
			allowNull: true,
		},
		number: {
			type: INTEGER,
			allowNull: true,
		},
		timestamp: {
			type: BIGINT,
			allowNull: true,
		},
		snapshot: {
			type: STRING,
			allowNull: true,
		}, fromNow: {
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
	const contracts = await DBlockMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

const asyncManyOperation = async (list: any) => {
	const results = await DBlockMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"chainId",
			"anchors",
			"coinbase",
			"contracts",
			"difficulty",
			"extra",
			"hash",
			"parentHash",
			"ledgerHash",
			"pow",
			"receiptHash",
			"receipts",
			"signer",
			"size",
			"td",
			"ttd",
			"number",
			"timestamp",
			"snapshot",
			"fromNow",
		],
	});
	return results;
};



export async function migrateDBlock() {



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
		const newList: DBlockMySqlType[] = []
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


		// const preList = await DBlockMySqlModel.findAll({
		// 	where: {
		// 		_id: {
		// 			[Op.in]: _ids,
		// 		},
		// 	},
		// });
		// if (!preList.length) {
		// 	await asyncManyOperation(newList)
		// } else {
		// 	const insertList: DBlockMySqlType[] = [];
		// 	const updateList: DBlockMySqlType[] = [];

		// 	newList.forEach((item: any) => {
		// 		const id = item._id;
		// 		if (!_idSet.has(id)) {
		// 			insertList.push(item);
		// 		} else {
		// 			updateList.push(item);
		// 		}
		// 	});

		// 	if (insertList.length) {
		// 		await asyncManyOperation(insertList)
		// 	}
		// 	if (updateList.length) {

		// 		await updateSequentially(updateList);
		// 	}
		// }
		lastId = list[list.length - 1]._id;
		console.log(`${tableName} ${current += list.length} ${lastId}`)
	}

	// 等待所有异步操作完成
}
