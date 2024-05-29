"use client"
import { useEffect, useState } from "react"
import { DataTable } from "@/app/inventory/staffs/components/data-table";
import { useStaffStore } from "@/lib/providers/staff-store-provider";
import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Staffs = () => {
    const [activeTab, setTab] = useQueryState("group", {defaultValue: "", clearOnDefault: true});
    const {groups, staff, page, setPage, hasNextPage, hasPrevPage, totalPages, applyFilter, filter, loaded} = useStaffStore((state) => state);
    // const [selectedGroup, setSelectedGroup] = useQueryState<string>("group", {defaultValue: ""});

    useEffect(() => {
        if (!loaded) return;
        if (activeTab == 'all') applyFilter({...filter, group: ''})
        else applyFilter({...filter, group: activeTab});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const changeStaff = () => { }
    return (
      <div className="flex flex-col absolute h-[calc(100vh-60px)] top-[60px] w-full">
        <div className="h-full relative bg-white overflow-auto md:m-6">
          <div className="flex flex-row justify-between items-center p-4 px-[30px]">
            <h1 className="text-xl font-heading font-semibold">Staffs</h1>
            <a href="#actions/staff/create">
              <Button className="flex flex-row gap-2">
                <Plus size={20} strokeWidth={1.5} />
                Register Staff
              </Button>
            </a>
          </div>
          <div className="mx-[30px] mt-3 flex flex-row justify-between items-center border-b border-neu-6">
            <ul className="flex flex-row items-start bg-white rounded-md overflow-x-auto overflow-y-clip">
              <li
                onClick={() => setTab("")}
                className={`capitalize cursor-pointer relative px-4 py-1 text-center text-[14px] transition-all duration-200 ease-in-out ${
                  activeTab == "" ? "tab" : ""
                }`}
              >
                All
              </li>
              {groups.map((group) => (
                <li
                  key={group.id}
                  onClick={() => setTab(group.id)}
                  className={`capitalize cursor-pointer relative px-4 py-1 text-center text-[14px] transition-all duration-200 ease-in-out ${
                    activeTab == group.id ? "tab" : ""
                  }`}
                >
                  {group.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full h-[calc(100%-45px)]">
            <DataTable
              data={staff}
              onChangeStaff={changeStaff}
              page={page}
              pageCount={totalPages}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onNext={() => setPage(page + 1)}
              onPrev={() => setPage(page - 1)}
            />
          </div>
        </div>
      </div>
    );
}

export default Staffs