import { TBlock } from "@latticelabs/sdk";
import { Document, model, Schema } from "mongoose";
import { Table } from "./table";
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
// import { batchSize } from "../config";

const tableName = "tblocks";

const batchSize = 20


type TBlockType = TBlock & {
	chain: number;
	uploadType: 0;
	isAccepted: boolean;
	isHide: boolean;
	_id?: string;
};

type TBlockDocument = Document & TBlockType;

const tblockSchema = new Schema(
	{
		chainId: {
			type: Number,
			index: true,
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
			required: true,
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
			default: false,
		},
		isHide: {
			type: Boolean,
			default: false,
		},
	},
	{ versionKey: false }
);

const TBlockMongoModel = model<TBlockDocument>(Table.TBlock, tblockSchema);

export interface TBlockMySqlType
	extends Model<
		InferAttributes<TBlockMySqlType>,
		InferCreationAttributes<TBlockMySqlType>
	>,
	TBlockType { }
// 定义模型

export const TBlockMySqlModel = mySqlConnection.define<TBlockMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(255),
			allowNull: false,
		},
		amount: {
			type: STRING,
			allowNull: true,
		},
		balance: {
			type: STRING,
			allowNull: true,
		},
		code: {
			type: TEXT("long"),
			allowNull: true,
		},
		codeHash: {
			type: STRING,
			allowNull: true,
		},
		daemonHash: {
			type: STRING,
			allowNull: true,
		},
		deposit: {
			type: STRING,
			allowNull: true,
		},
		difficulty: {
			type: INTEGER,
			allowNull: true,
		},
		hash: {
			type: STRING,
			allowNull: true,
		},
		hub: {
			allowNull: true,
			type: DataTypes.TEXT("long"),
			get() {
				const value = (this.getDataValue("hub") ||
					JSON.stringify([])) as unknown as string;
				return JSON.parse(value);
			},
			set(value) {
				const v: unknown[] = JSON.stringify(value) as unknown as unknown[];
				this.setDataValue("hub", v);
			},
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
			defaultValue: true,
		},
		uploadType: {
			allowNull: true,
			type: INTEGER,
		},
		isAccepted: {
			type: BOOLEAN,
			allowNull: true,
		},
		isHide: {
			allowNull: true,
			type: BOOLEAN,
		},
	},
	{
		tableName: tableName, // 指定表名
		timestamps: false, // 禁用自动添加的时间戳字段
		modelName: tableName,
	}
);

const getMongoData = async (query: any): Promise<TBlockType[]> => {
	const list = await TBlockMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return list;
};


const asyncManyOperation = async (list: any) => {
	const results = await TBlockMySqlModel.bulkCreate(list);
	return results;
};


function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await TBlockMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

async function updateSequentially(updateList: TBlockMySqlType[]) {
	for (const item of updateList) {
		console.log('updateSequentially', item._id);
		await updateOperation(item);
	}
}


// 迁移链数据库
export async function migrateTBlocks() {
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
		const newList: TBlockMySqlType[] = []
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


		const preList = await TBlockMySqlModel.findAll({
			where: {
				_id: {
					[Op.in]: _ids,
				},
			},
		});

		if (!preList.length) {
			await asyncManyOperation(newList)
		} else {
			const insertList: TBlockMySqlType[] = [];
			const updateList: TBlockMySqlType[] = [];

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


}
