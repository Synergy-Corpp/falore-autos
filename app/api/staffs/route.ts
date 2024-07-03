import User, { IUserDocument } from "@/lib/common/models/user";
import { FilterQuery } from "mongoose";
import { NextResponse } from "next/server";
import permissionRequired from "@/lib/decorators/permission";
import { Permission } from "@/lib/permissions/base";
import UserDAO from "@/lib/common/dao/user";
import GroupDAO from "@/lib/common/dao/group";
import Group, { IGroupDocument } from "@/lib/common/models/group";
import mongoose from "mongoose";
export const GET = permissionRequired(Permission.AllowAny())(async function (
    req
) {
    const rawLimit = req.nextUrl.searchParams.get("l");
    const limit = rawLimit ? parseInt(rawLimit) : 10;
    const rawPage = req.nextUrl.searchParams.get("p");
    const page = rawPage ? parseInt(rawPage) : 1;
    const group = (req.nextUrl.searchParams.get("g") as string | null) || ""
    const search = (req.nextUrl.searchParams.get("q") as string | null) || "";
    const status = req.nextUrl.searchParams.get("s") as
        | "active"
        | "banned"
        | null;
    const query: FilterQuery<IUserDocument> = {};
    console.log("Search", search, status)
    if (status) {
        query.status = status
    }
    if (group) {
        const groupData = await Group.findById(group)
        if (groupData) {
            query._id = { $in: groupData.members_ids};
        }
    }
    // email and phone search
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
    // full name search
    const names = search.split(" ").slice(0, 2);
    if (names.length === 2) {
        // search by first name and last name
        query.$or = [
          {
            $or: [
              { firstName: { $regex: names[1], $options: "i" } },
              { lastName: { $regex: names[0], $options: "i" } },
            ],
          },
          // search by last name and first name
          {
            $or: [
              { firstName: { $regex: names[0], $options: "i" } },
              { lastName: { $regex: names[1], $options: "i" } },
            ],
          },
          ...query.$or
        ];
    } else {
        // search by first name or last name
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          ...query.$or
        ];
    }
    const results = await UserDAO.getUsers({filters: query, page, limit});
    return NextResponse.json(results);
});


interface NewStaffRequest {
  lastName: string;
  firstName: string;
  phone: string;
  email: string;
  groups: { label: string; value: string }[];
}

export const POST = permissionRequired(Permission.AllowAny())(async function (
  req
) {
  const body: NewStaffRequest = await req.json();
  const groups: IGroupDocument[] = [];
  // validate groups
  for (const group of body.groups) {
    if (!mongoose.Types.ObjectId.isValid(group.value)) {
      return NextResponse.json({ error: "Invalid group id" }, { status: 400 });
    }
    const doc = await Group.findById(group.value);
    if (!doc) {
      return NextResponse.json(
        { error: `Group "${group.value}" not found` },
        { status: 404 }
      );
    }
    groups.push(doc);
  }
  try {
    // create user
    const user = await UserDAO.addUser({
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      password: body.email,
    });
    // add user to groups
    for (const group of groups) {
      await GroupDAO.addMember(group.id, user.id);
    }
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
});