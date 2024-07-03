import { Document, model, SchemaTypes, Schema, Types } from 'mongoose'
import { Table } from './table';
import {
	INTEGER,
	Model,
	InferAttributes,
	InferCreationAttributes,
	STRING,
	TEXT,
	FLOAT,
	Op,
	BIGINT,
	BOOLEAN,
} from "sequelize";
import { mySqlConnection } from "../connection";

// import { batchSize } from "../config";

const batchSize = 2000

const tableName = "presetContracts"

type PresetContractsType = {
	_id?: string
	name: string
	description: string
	address: string
	abi?: string
}


export type PresetContractsDocument = Document & PresetContractsType

const executeSchema = new Schema(
	{
		name: String,
		description: String,
		address: String,
		abi: String
	},
	{ timestamps: true, versionKey: false }
)

export const PresetContractsMongoModel = model<PresetContractsDocument>(Table.PresetContract, executeSchema)



export interface PresetContractsMySqlType
	extends Model<
		InferAttributes<PresetContractsMySqlType>,
		InferCreationAttributes<PresetContractsMySqlType>
	>,
	PresetContractsType { }


export const PresetContractsMySqlModel = mySqlConnection.define<PresetContractsMySqlType>(
	tableName,
	{
		_id: {
			type: STRING(32),
			unique: true,
			allowNull: false
		},
		name: {
			type: STRING(255),
			allowNull: true,
		},
		description: {
			type: STRING,
			allowNull: true,
		},
		address: {
			type: STRING,
			allowNull: true,
		},
		abi: {
			type: TEXT("long"),
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
	const contracts = await PresetContractsMongoModel.find(query).sort({ _id: 1 }).limit(batchSize);
	return contracts;
};

function updateOperation(data: any) {
	return new Promise(async (resolve) => {
		await PresetContractsMySqlModel.update(data, {
			where: {
				_id: data._id,
			},
		});
		resolve({});
	});
}

const asyncManyOperation = async (list: any) => {
	const results = await PresetContractsMySqlModel.bulkCreate(list, {
		ignoreDuplicates: false,
		updateOnDuplicate: [
			"name",
			"description",
			"address",
			"abi",
		],
	});
	return results;
};



async function updateSequentially(updateList: PresetContractsMySqlType[]) {
	for (const item of updateList) {
		console.log('update preset contract', item._id);
		await updateOperation(item);
	}
}


export async function migratePresetContract() {



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
		const newList: PresetContractsMySqlType[] = []
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
		// const preList = await PresetContractsMySqlModel.findAll({
		// 	where: {
		// 		_id: {
		// 			[Op.in]: _ids,
		// 		},
		// 	},
		// });
		// if (!preList.length) {
		// } else {
		// 	const insertList: PresetContractsMySqlType[] = [];
		// 	const updateList: PresetContractsMySqlType[] = [];

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
