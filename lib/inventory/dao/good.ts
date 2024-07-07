import { GoodModel, IGoodDocument } from '../../inventory/models/good';
import mongoose, { FilterQuery } from 'mongoose';
import { OrderItemModel } from '../models/orderItem';
import { OrderModel } from '../models/order';

interface PaginatedGoods {
    goods: (IGoodDocument & { id: string })[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    next: number | null;
    prev: number | null;
    hasPrevPage: boolean;
    hasNextPage: boolean;
}

interface Good {
    name: string;
    costPrice: number;
    qty: number;
    description: string;
    minQty: number;
    productId: string;
}

async function addGood(params: Good) {
    const good = new GoodModel(params);

    // validate the good data

    await good.save();
    return good;
}

async function getGood(id?: mongoose.Types.ObjectId, filters?: Partial<Good>) {
    let query = {};
    if (id) query = { _id: id };
    if (filters) query = { ...query, ...filters };
    if (!id && !filters) {
        throw new Error("No values provided")
    }
    const good = await GoodModel.findOne(query).exec();
    if (!good) {
        throw new Error("Good not found");
    }
    return good;
}

async function getGoods({
    filters, page = 1, limit = 10
}: {
    filters: FilterQuery<IGoodDocument>;
    page: number;
    limit: number;
}): Promise<PaginatedGoods> {
    if (page < 1) {
        throw new Error("Invalid page number");
    }
    if (limit < 1) {
        throw new Error("Invalid limit");
    }

    const query = filters ? filters : {};
    const totalDocs = await GoodModel.countDocuments(query).exec();
    const totalPages = Math.ceil(totalDocs / limit);
    if (page > 1 && page > totalPages) {
        throw new Error("Page not found");
    }
    const skip = (page - 1) * limit;
    const goods = await GoodModel.find(query).skip(skip).limit(limit).lean().exec();
    const next = goods.length === limit ? page + 1 : null;
    const prev = page > 1 ? page - 1 : null;
    return {
        // @ts-ignore
        goods: goods.map(good => ({ ...good, id: good._id.toString()})),
        totalDocs,
        limit,
        page,
        totalPages,
        next, 
        prev,
        hasPrevPage: prev !== null,
        hasNextPage: next !== null
    };
}

async function restockGood(id: mongoose.Types.ObjectId, qty: number) {
  return await GoodModel.findByIdAndUpdate(id, { $inc: { qty } }, { new: true });
}


async function updateGood(id: mongoose.Types.ObjectId, params: Partial<Good>) {
    return await GoodModel.findByIdAndUpdate(id, params, { new: true });
}

async function deleteGood(id: mongoose.Types.ObjectId) {
    const orderItems = await OrderItemModel.find({ goodId: id });
    const itemIds = orderItems.map(item => item._id);
    const count = await OrderModel.countDocuments({ status: { $in: ['pending', 'paid', 'error'] }, _id: { $in: itemIds } });
    if (count > 0) {
        throw new Error("Cannot delete good with active orders");
    }
    const good = await GoodModel.findByIdAndDelete(id);
    if (!good) {
        throw new Error("Good not found");
    }
    return good;
}
const GoodDAO = {
    addGood,
    getGood,
    getGoods,
    restockGood,
    updateGood,
    deleteGood
}
 export default GoodDAO;