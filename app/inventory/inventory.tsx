"use client";
import React, { createContext } from "react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/providers/auth-store-provider";
import MainDropdown from "../../components/dropdown/MainDropdown";
import AddNewStaffModal from "./staffs/components/modals/create-staff";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  SquareChevronLeft,
  SquareChevronRight,
  Package,
  ReceiptText,
  CircleDollarSign,
  Users,
  Scroll,
  Fingerprint,
  CircleUser,
  LayoutDashboard,
  Lock,
  ShoppingCart,
} from "lucide-react";
import InventoryProviders from "./providers";
import AddGoodModal from "@/components/modals/AddGoodModal";
import AddNewBuyerModal from "./buyers/components/modals/create-buyer";
import Image from "next/image";
import { companyName } from "@/data";
import * as gravatar from "gravatar";
import { Button } from "@/components/ui/button";
import LogoutModal from "@/components/modals/LogoutModal";
import Link from "next/link";
import { ability, Ability, Actions, Subjects } from "@/lib/permissions/ability";
import { useAbility } from "@/lib/hooks/ability";
import { createContextualCan } from "@casl/react"

interface SectionItem {
  icon: React.ReactNode;
  content: React.ReactNode | string;
  link: string;
  getIsActive: (pathname: string) => boolean;
  ability: {
    action: Actions;
    subject: Subjects;
  };
}

interface Section {
  name: string;
  content?: React.ReactNode;
  items: SectionItem[];
  show: boolean;
  ability?: {
    action: Actions;
    subject: Subjects;
  };
}

const sections: Section[] = [
  {
    name: "Inventory",
    show: true,
    items: [
      {
        icon: <LayoutDashboard size={20} strokeWidth={1.5} />,
        content: "Dashboard",
        getIsActive: (pathname) =>
          pathname === "/inventory" || pathname === "/inventory/",
        link: "/inventory",
        ability: {
          action: "read",
          subject: "dashboard",
        },
      },
      {
        icon: <Package size={20} strokeWidth={1.5} />,
        content: "Store",
        getIsActive: (pathname) => pathname.startsWith("/inventory/products"),
        link: "/inventory/products",
        ability: {
          action: "read",
          subject: "product",
        },
      },
      {
        icon: <ReceiptText size={20} strokeWidth={1.5} />,
        content: "Quick Receipts",
        getIsActive: (pathname) => pathname.startsWith("/inventory/quick-receipts"),
        link: "/inventory/quick-receipts",
        ability: {
          action: "read",
          subject: "order",
        },
      },
      {
        icon: <ShoppingCart size={20} strokeWidth={1.5} />,
        content: "Orders",
        getIsActive: (pathname) => pathname.startsWith("/inventory/orders"),
        link: "/inventory/orders",
        ability: {
          action: "read",
          subject: "order",
        },
      },
      {
        icon: <CircleDollarSign size={20} strokeWidth={1.5} />,
        content: "Invoices",
        getIsActive: (pathname) => pathname.startsWith("/inventory/invoices"),
        link: "/inventory/invoices",
        ability: {
          action: "read",
          subject: "order",
        },
      },
      {
        icon: <CircleDollarSign size={20} strokeWidth={1.5} />,
        content: "Payments",
        getIsActive: (pathname) => pathname.startsWith("/inventory/payments"),
        link: "/inventory/payments",
        ability: {
          action: "read",
          subject: "payment",
        },
      },
      {
        icon: <Users size={20} strokeWidth={1.5} />,
        content: "Customers",
        getIsActive: (pathname) => pathname.startsWith("/inventory/buyers"),
        link: "/inventory/buyers",
        ability: {
          action: "read",
          subject: "customer",
        },
      },
    ],
  },
  {
    name: "Access Control",
    show: true,
    items: [
      {
        icon: <CircleUser size={20} strokeWidth={1.5} />,
        content: "Manage Staff",
        getIsActive: (pathname) => pathname.startsWith("/inventory/staffs"),
        link: "/inventory/staffs",
        ability: {
          action: "read",
          subject: "user",
        },
      },
      {
        icon: <Fingerprint size={20} strokeWidth={1.5} />,
        content: "Manage Roles",
        getIsActive: (pathname) => pathname.startsWith("/inventory/roles"),
        link: "/inventory/roles",
        ability: {
          action: "read",
          subject: "permission",
        },
      },
      {
        icon: <Scroll size={20} strokeWidth={1.5} />,
        content: "Activity Logs",
        getIsActive: (pathname) => pathname.startsWith("/inventory/logs"),
        link: "/inventory/logs",
        ability: {
          action: "read",
          subject: "log",
        },
      },
    ],
  },
];

const AbilityContext = createContext<Ability>(ability);
export const Can = createContextualCan(AbilityContext.Consumer);


export default function Inventory({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showMenu, setShowMenu] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const { email } = useAuthStore((state) => state);
  const [showSections, setShowSections] = useState<{
    [key: string]: boolean;
  }>({});
  const pathname = usePathname();
  const ability = useAbility();
  function toggleSection(section: string, defaultValue = true) {
    setShowSections((prev) => ({
      ...prev,
      [section]: !(prev[section] === undefined ? defaultValue : prev[section]),
    }));
  }

  function canShowSection(section: string, defaultValue = true): boolean {
    return showSections[section] === undefined
      ? defaultValue
      : showSections[section];
  }

  const handleCloseMenu = () => {
    setShowMenu(window.innerWidth > 768);
  }

  useEffect(() => {
    setShowMenu(window.innerWidth > 768);
    function handleResize() {
      setShowMenu(window.innerWidth > 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <AbilityContext.Provider value={ability}>
      <LogoutModal />
      <div className="fixed flex flex-row items-center justify-start top-0 left-0">
        <nav
          className={`fixed top-0 md:relative h-screen bg-white w-[220px] flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${showMenu ? "left-0" : "-left-[219px]"
            } border-r border-neu-3 border-1 shadow-lg text-neu-9 font-quicksand z-50 `}
        >
          <div className="header pt-4 text-center">
            <Image
              className="mx-auto"
              src="/logo.png"
              width={50}
              height={50}
              alt="logo"
            />
            <h1 className="text-xl font-lg pb-1">{companyName}</h1>
          </div>

          {showMenu ? (
            <SquareChevronLeft
              size={28}
              strokeWidth={1.5}
              onClick={() => setShowMenu((prev) => !prev)}
              className="absolute top-[20px] right-[-40px] cursor-pointer text-black transition active:scale-95 duration-200 ease-in z-30"
            />
          ) : (
            <SquareChevronRight
              strokeWidth={1.5}
              size={28}
              onClick={() => setShowMenu((prev) => !prev)}
              className="absolute top-[20px] right-[-40px] cursor-pointer text-black transition active:scale-95 duration-200 ease-in z-30"
            />
          )}
          <ul className="flex flex-col p-[10px] py-[30px] gap-[15px] overflow-y-auto scrollbar-thin mb-[50px]">
            {sections.map((section) => (
              <li key={section.name}>
                <h3
                  onClick={() => toggleSection(section.name, section.show)}
                  className="cursor-pointer text-pri-6 font-[600] w-full font-quicksand flex flex-row items-center justify-between"
                >
                  {section.content || section.name}
                  {canShowSection(section.name, section.show) ? (
                    <ChevronDown strokeWidth={1.5} size={20} />
                  ) : (
                    <ChevronRight strokeWidth={1.5} size={20} />
                  )}{" "}
                </h3>
                {canShowSection(section.name, section.show) && (
                  <ul className="flex flex-col">
                    {section.items.map((item, idx) => (
                      <Can key={idx} do={item.ability.action} on={item.ability.subject} passThrough>
                        {
                          allowed => (
                            allowed ? (
                              <Link
                                href={item.link}
                                onClick={handleCloseMenu}
                                className={`cursor-pointer flex flex-row gap-[8px] justify-start items-center p-3 text-[15px] hover:bg-pri-5 hover:text-white transition-all duration-200 ease-in active:scale-95 ${item.getIsActive(pathname) ? "active-nav" : ""
                                  }`}
                              >
                                {item.icon}
                                {item.content}
                              </Link>
                            ) : <p
                              className={`cursor-not-allowed flex flex-row gap-[8px] justify-start items-center p-3 text-[15px] hover:bg-pri-5/50 hover:text-white transition-all duration-200 ease-in active:scale-95 ${item.getIsActive(pathname) ? "active-nav" : ""
                                }`}
                            >
                              <Lock size={20} strokeWidth={1.5} className="text-neu-5" />
                              {item.content}
                            </p>
                          )
                        }

                      </Can>
                    ))}
                  </ul>
                )}
              </li>
            ))}

          </ul>
        </nav>
        <main
          className={`relative top-0 flex flex-column w-screen ${showMenu ? "md:w-[calc(100vw-220px)]" : "md:w-screen"
            }  m-small pt-[40px] bg-neu-1 ${showMenu ? "md:left-0" : "md:left-[-220px]"
            } flex-grow h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out font-lato`}
        >
          {showMenu && (
            <div
              className="md:w-0 md:h-0 transition-width duration-300 ease flex w-full h-full fixed left-0 top-0 bg-black bg-opacity-50 z-40 backdrop-blur-md"
              onClick={() => setShowMenu(false)}
            ></div>
          )}
          <header
            className={`fixed top-0 right-0 w-screen h-[60px] ${showMenu ? "md:w-[calc(100vw-220px)]" : "md:w-screen"
              }  border-b border-neu-3 bg-white overflow-visible z-30 transition-all duration-200 ease-in`}
          >
            <div className="relative">
              <div className="absolute right-[10px] top-[15px] overflow-visible flex flex-col items-end justify-start">
                <Button
                  variant={"ghost"}
                  className="inline-flex items-center p-2 gap-3 capitalize font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-50"
                  type="button"
                  id="dropdownToggle"
                  onClick={() => setShowDropdown((show) => !show)}
                >
                  <Image
                    src={gravatar.url(
                      email || "",
                      {
                        s: "30",
                      },
                      true
                    )}
                    width={30}
                    height={30}
                    alt="avatar"
                    className="rounded-full"
                  />
                </Button>
                <MainDropdown show={showDropdown} setShow={setShowDropdown} />
              </div>
            </div>
          </header>
          <AddGoodModal />
          <AddNewStaffModal />
          <AddNewBuyerModal />
          {children}
        </main>
      </div>
    </AbilityContext.Provider>
  );
}
