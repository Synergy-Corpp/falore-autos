import mongoose from "mongoose";
import { OrderItemModel } from "../models/orderItem";
import { OrderModel } from "../models/order";
import { GoodModel } from "../models/good";
import { BuyerModel } from "../models/buyer";
import {
  createBuyerRevenueByPeriodChart,
  createRevenueByBuyerChart,
  createRevenueByGoodChart,
  createRevenueByPeriodChart,
} from "../../core/insightsVisualizer";

async function revenueByBuyer(visualize: boolean = false) {
  try {
    const results = await OrderModel.aggregate([
      {
        $lookup: {
          from: OrderItemModel.collection.name, // Automatically get the collection name
          localField: "_id", // Field in Order collection
          foreignField: "orderId", // Corresponding field in OrderItem collection
          as: "items", // Resultant array of joined documents
        },
      },
      { $unwind: "$items" }, // Flatten the array of items
      {
        $group: {
          _id: "$buyerId", // Group by buyerId
          totalRevenue: { $sum: "$items.sellingPrice" }, // Sum of selling prices for revenue
          totalCost: { $sum: "$items.costPrice" }, // Sum of cost prices for cost
        },
      },
      {
        $lookup: {
          from: "buyers", // Assuming 'buyers' is the collection name for BuyerModel
          localField: "_id",
          foreignField: "_id",
          as: "buyerDetails",
        },
      },
      { $unwind: "$buyerDetails" },
      {
        $project: {
          _id: 0,
          buyerName: "$buyerDetails.name",
          totalRevenue: 1,
          totalCost: 1,
          profit: { $subtract: ["$totalRevenue", "$totalCost"] }, // Calculate profit
        },
      },
      { $sort: { buyerName: 1 } },
    ]);
    if (visualize) {
      console.table(results);
      createRevenueByBuyerChart(results);
    } else return results;
  } catch (error) {
    console.error("Error calculating revenue by buyer:", error);
    throw error;
  }
}

async function revenueByGood(visualize: boolean = false) {
  try {
    const results = await OrderItemModel.aggregate([
      {
        $lookup: {
          from: OrderModel.collection.name, // Link OrderItem with Order
          localField: "orderId", // Field in OrderItem collection
          foreignField: "_id", // Corresponding field in Order collection
          as: "order", // Resultant array of joined documents
        },
      },
      { $unwind: "$order" }, // Flatten the array of orders
      {
        $match: {
          // Filter for only pending or paid orders
          "order.status": { $in: ["pending", "paid"] },
        },
      },
      {
        $lookup: {
          from: GoodModel.collection.name, // Automatically get the collection name
          localField: "goodId", // Field in OrderItem collection
          foreignField: "_id", // Corresponding field in Good collection
          as: "goodDetails", // Resultant array of joined documents
        },
      },
      { $unwind: "$goodDetails" }, // Flatten the array of goods
      {
        $group: {
          _id: "$goodId", // Group by goodId
          goodName: { $last: "$goodDetails.name" },
          totalRevenue: { $sum: { $multiply: ["$qty", "$sellingPrice"] } }, // Sum of revenue for each good
          totalCost: { $sum: { $multiply: ["$qty", "$costPrice"] } }, // Sum of cost prices for each good
          totalQuantitySold: { $sum: "$qty" }, // Total quantity sold for each good
        },
      },
      {
        $project: {
          _id: 0,
          goodName: 1,
          totalRevenue: 1,
          totalCost: 1,
          totalQuantitySold: 1,
          profit: { $subtract: ["$totalRevenue", "$totalCost"] }, // Calculate profit
        },
      },
      { $sort: { goodName: 1 } },
    ]);
    if (visualize) {
      console.table(results);
      createRevenueByGoodChart(results);
    } else return results;
  } catch (error) {
    console.error("Error calculating revenue by good:", error);
    throw error;
  }
}

async function revenueByPeriod(
  metric: "hour" | "day" | "month" | "year",
  before?: Date,
  after?: Date,
  visualize: boolean = false
) {
  if (before && after && before < after) {
    throw new Error("Invalid date range: before must be after after");
  }
  const query: any = {};
  if (before) {
    query["order.createdAt"] = { $lte: before };
  }
  if (after) {
    query["order.createdAt"] = { $gte: after };
  }
  try {
    let dateOperator;
    let groupOperator;
    switch (metric) {
      case "hour":
        dateOperator = { $hour: "$order.createdAt" };
        groupOperator = { $dayOfYear: "$order.createdAt" };
        break;
      case "day":
        dateOperator = { $dayOfWeek: "$order.createdAt" };
        groupOperator = { $week: "$order.createdAt" };
        break;
      case "month":
        dateOperator = { $month: "$order.createdAt" };
        groupOperator = { $year: "$order.createdAt" };
        break;
      case "year":
        dateOperator = { $year: "$order.createdAt" };
        groupOperator = dateOperator;
        break;
      default:
        throw new Error(`Invalid metric: ${metric}`);
    }
    const pipeline = [
      {
        $lookup: {
          from: OrderModel.collection.name,
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.status": { $in: ["pending", "paid"] },
          ...query,
        },
      },
      {
        $group: {
          _id: dateOperator,
          period: { $first: dateOperator},
          totalRevenue: { $sum: { $multiply: ["$qty", "$sellingPrice"] } },
          totalCost: { $sum: { $multiply: ["$qty", "$costPrice"] } },
          totalQuantitySold: { $sum: "$qty" },
        },
      },
      {
        $project: {
          _id: 0,
          period: 1,
          totalRevenue: 1,
          totalCost: 1,
          totalQuantitySold: 1,
          profit: { $subtract: ["$totalRevenue", "$totalCost"] },

        },
      },
      // { $sort: { totalRevenue: 1 } },

    ];

    const results = await OrderItemModel.aggregate(pipeline);
    const pending = await OrderModel.countDocuments({ status: 'pending', ...query});
    const errors = await OrderModel.countDocuments({ status: 'error', ...query});
    const paid = await OrderModel.countDocuments({ status: 'paid', ...query });
    const rest = await OrderModel.countDocuments({ status: 'rest', ...query});
    const cancelled = await OrderModel.countDocuments({ status: "cancelled", ...query});
    const total = pending + errors + paid + rest
    const summary = { pending, errors, paid, rest, total, cancelled }
    if (visualize) {
      console.table(results);
      createRevenueByPeriodChart(results);
    } else {
      return { results, summary };
    }
  } catch (error) {
    console.error("Error calculating revenue by period:", error);
    throw error;
  }
}
async function buyerRevenueByPeriod(
  metric: "day" | "month" | "year",
  visualize: boolean = false
) {
  try {
    const results = await OrderItemModel.aggregate([
      {
        $lookup: {
          from: OrderModel.collection.name, // Link OrderItem with Order
          localField: "orderId", // Field in OrderItem collection
          foreignField: "_id", // Corresponding field in Order collection
          as: "order", // Resultant array of joined documents
        },
      },
      { $unwind: "$order" }, // Flatten the array of orders
      {
        $match: {
          // Filter for only pending or paid orders
          "order.status": { $in: ["pending", "paid"] },
        },
      },
      {
        $lookup: {
          from: BuyerModel.collection.name, // Link Order with Buyer
          localField: "order.buyerId", // Field in Order collection
          foreignField: "_id", // Corresponding field in Buyer collection
          as: "buyer", // Resultant array of joined documents
        },
      },
      { $unwind: "$buyer" }, // Flatten the array of buyers
      {
        $group: {
          _id: {
            period: {
              $dateTrunc: {
                // Truncate date to specified metric
                date: "$order.createdAt", // Use the createdAt field
                unit: metric, // Dynamic metric (days, month, years)
              },
            },
            buyer: "$buyer.name", // Group additionally by buyer's name
          },
          totalRevenue: { $sum: { $multiply: ["$qty", "$sellingPrice"] } }, // Sum of revenue for each period and buyer
          totalCost: { $sum: { $multiply: ["$qty", "$costPrice"] } }, // Sum of cost for each period and buyer
          totalQuantitySold: { $sum: "$qty" }, // Total quantity sold for each period and buyer
        },
      },
      {
        $project: {
          _id: 0,
          period: "$_id.period",
          buyer: "$_id.buyer",
          totalRevenue: 1,
          totalCost: 1,
          totalQuantitySold: 1,
          profit: { $subtract: ["$totalRevenue", "$totalCost"] }, // Calculate profit
        },
      },
      { $sort: { period: 1, buyer: 1 } }, // Sort by period and buyer in ascending order
    ]);
    if (visualize) {
      console.table(results);
      createBuyerRevenueByPeriodChart(results);
    } else return results;
  } catch (error) {
    console.error("Error calculating buyer revenue by period:", error);
    throw error;
  }
}
const InsightsDAO = {
  revenueByBuyer,
  revenueByGood,
  revenueByPeriod,
  buyerRevenueByPeriod,
};

export default InsightsDAO;
