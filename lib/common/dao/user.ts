import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel, { IUserDocument } from "../models/user";
import mongoose, { FilterQuery } from 'mongoose';
import {
    validateEmail,
    validateFirstName,
    validateLastName,
    validatePassword,
    validatePhoneNumber,
} from "../validation";
import LogDAO from "./log";

interface createUserParams {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
}

interface updateUserParams {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
}

interface PaginatedUsers {
    users: IUserDocument[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    next: number | null;
    prev: number | null;
    hasPrevPage: boolean;
    hasNextPage: boolean;
}

async function addUser({
    firstName,
    lastName,
    email,
    phone,
    password,
}: createUserParams) {
    firstName = validateFirstName(firstName);
    lastName = validateLastName(lastName);
    email = validateEmail(email);
    phone = validatePhoneNumber(phone);
    password = validatePassword(password);

    if ((await UserModel.countDocuments({ email, isDeleted: false }).exec()) > 0) {
        throw new Error("User with email already exists");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
    });
    await user.save();
    LogDAO.logCreation({
        description: `User ${user.fullName()} created`,
        target: "User",
        targetId: user._id,
        loggerId: user._id,
    });
    return user;
}

async function getUsers({
  filters,
  page = 1,
  limit = 10,
}: {
  filters: FilterQuery<IUserDocument>;
  page: number;
  limit: number;
}): Promise<PaginatedUsers> {
  if (page < 1) {
    throw new Error("Invalid page number");
  }
  if (limit < 1) {
    throw new Error("Invalid limit");
  }

  const query = filters ? filters : {};
  const totalDocs = await UserModel.countDocuments(query).exec();
  const totalPages = Math.ceil(totalDocs / limit);
  if (page > 1 && page > totalPages) {
    throw new Error("Page not found");
  }
  const skip = (page - 1) * limit;
  const users = await UserModel.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ firstName: 1, lastName: 1})
    .lean()
    .exec();
  const next = users.length === limit ? page + 1 : null;
  const prev = page > 1 ? page - 1 : null;
  return {
    // @ts-ignore
    users: users.map((good) => ({ ...good, id: good._id.toString() })),
    totalDocs,
    limit,
    page,
    totalPages,
    next,
    prev,
    hasPrevPage: prev !== null,
    hasNextPage: next !== null,
  };
}

async function updateUser(
    id: mongoose.Types.ObjectId,
    params: updateUserParams
) {
    const firstName = params.firstName
        ? validateFirstName(params.firstName)
        : undefined;
    const lastName = params.lastName
        ? validateLastName(params.lastName)
        : undefined;
    const email = params.email ? validateEmail(params.email) : undefined;
    const phone = params.phone ? validatePhoneNumber(params.phone) : undefined;
    const password = params.password
        ? validatePassword(params.password)
        : undefined;
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    if (email && (await UserModel.countDocuments({ email, _id: {"$ne": id}, isDeleted: false }).exec()) > 0) {
        throw new Error("User with email already exists");
    }
    const user = await UserModel.findOne({_id: id, isDeleted: false });
    if (!user) {
        throw new Error("User not found");
    }
    const details: updateUserParams = {};
    const payload: any = {};
    if (firstName){
         payload.firstName = firstName
         details.firstName = user.firstName

    };
    if (lastName) {
        payload.lastName = lastName;
        details.lastName = user.lastName;
    }
    if (email) {
        payload.email = email;
        details.email = user.email;
    }
    if (phone) {
        payload.phone = phone;
        details.phone = user.phone;
    }
    if (passwordHash) {
        payload.password = passwordHash;
        details.password = user.password
    }
    if (!payload) return user;

    Object.assign(user, payload);
    await user.save();
    LogDAO.logModification({
        description: `User ${user.fullName()} updated`,
        target: "User",
        targetId: user._id,
        loggerId: user._id,
        details,
    });
    return user;
}

async function deleteUser(id: mongoose.Types.ObjectId) {
    const user = await UserModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );
    if (!user) {
        throw new Error("User not found");
    }
    LogDAO.logDeletion({
        description: `User ${user.fullName()} deleted`,
        target: "User",
        targetId: user._id,
        loggerId: user._id,
    });
    return user;
}

async function authenticateUser(email: string, password: string) {
    const user = await UserModel.findOne({ email, isDeleted: false});
    if (!user) {
        throw new Error("User not found");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid password");
    }
    const token = jwt.sign({ sub: user._id.toHexString() }, process.env.JWT_SECRET as string, {
        expiresIn: process.env.JWT_EXPIRY, algorithm: "HS256"
    });
    return { token, user };
}

async function getUser(id: mongoose.Types.ObjectId) {
    const user = await UserModel.findOne({ _id: id, isDeleted: false }, { password: 0 , __v: 0, isDeleted: 0}).exec();
    return user
}

const UserDAO = {
    addUser,
    getUsers,
    deleteUser,
    updateUser,
    authenticateUser,
    getUser
};

export default UserDAO;
