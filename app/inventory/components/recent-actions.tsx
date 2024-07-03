import Overdue from './overdue-order';
import Recents from './recents'
import { Button } from '@/components/ui/button'
import { Boxes, Users, ReceiptText, UsersRound, CircleDollarSign, ShoppingCart, TrendingUp, TrendingDown, LoaderPinwheel } from 'lucide-react'
import Link from 'next/link'
import { FC, useState, useEffect } from 'react'
import axios from 'axios';
import { formatCurrencyShort, formatPercentage } from '@/lib/utils';
import { DashboardProps } from '@/lib/@types/dashboard';

interface ProductVal {
    name: string;
    id: string;
    qtySold: number;
    revenue: number;
    orderCount: number;
    profitPercentage: number

}
const RecentActions: FC<Partial<DashboardProps>> = ({ before, after }) => {
    const [mvp, setMVP] = useState<ProductVal | null>(null)
    const [search, setS] = useState(false)
    const [mpp, setMPP] = useState<ProductVal | null>(null)
    const ctab = [
        { front: "Create Invoice", icon: ReceiptText, link: "#"},
        { front: "Register Customer", icon: UsersRound, link: "#actions/buyer/create" },
        { front: "New Product", icon: Boxes, link: "#actions/product/add-new"},
        { front: "Add Staff", icon: Users, link: "#actions/staff/add-new-staff"}
    ]
    const fetchSummary = async (before?: string, after?: string) => {
        try {
            let query = '?'
            if (before) query += `&b=${encodeURIComponent(before)}`;
            if (after) query += `&a=${encodeURIComponent(after)}`;
            if (!(before || after)) query = '';
            const response = await axios.get(`/api/insights/overall-best-products-per-period${query}`)
            if (response.status !== 200) {
                throw response;
            }
            return response.data
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        setS(true)
        fetchSummary(before, after).
            then(({ mvp, mpp }) => {
                setMVP(mvp)
                setMPP(mpp)
                setS(false)
            })
    }, [before, after])
    useEffect(() => {
        console.log("Summary", mvp) 
    })
    return (
        <div className="flex flex-row  w-[100%] flex-wrap items-stretch justify-between gap-6 rounded-md">
            <div className="flex flex-col gap-3 w-[100%] md:w-[60%]">
                <Recents {...{ before, after }}/>
                <Overdue/>
            </div>

            <div className="flex flex-col w-full md:w-[calc(40%-2em)] gap-6 h-full self-stretch">
                <ul className="flex flex-row flex-wrap items-center justify-start gap-3">
                    {
                        ctab.map(({ front, icon: Icon, link }, idx) => {
                            return (
                                <li key={idx} className="cursor-pointer grow bg-pri-5 text-white active:scale-95 transition-transform  flex flex-col items-center justify-center text-[12px] w-[150px] font-quicksand font-semibold p-3 shadow-md rounded-md"
                                onClick={() => {window.location.hash = link}}>
                                    <Button className="flex flex-row items-center justify-center">
                                        <Icon size={28} strokeWidth={2} />
                                    </Button>
                                    <p>{front}</p>
                                </li>
                            )
                        })
                    }
                </ul>
                <div className="rounded-md min-h-[150px] w-full border border-neu-2 bg-white flex flex-col items-center justify-center p-3 gap-3 shadow-md">
                    <p className="text-sm text-neu-6">Most Valuable Product (MVP)</p>
                    {search && <LoaderPinwheel size={40} strokeWidth={2.5} color='#2D6DBE' className='animate-spin' />
                        || (mvp && <Link className='hover:cursor-pointer hover:bg-neu-1 w-full p-2' href={`/inventory/products?query=${mvp.name}`}>
                            <div className="flex flex-row items-center justify-start gap-4">
                                <p className="font-semibold text-pri-6 text-lg font-rambla">{mvp.name}</p>
                                <ul className="grow flex flex-col gap-1">
                                    <li className="flex flex-row items-center justify-start gap-2"><ShoppingCart strokeWidth={1.5} size={20} /> <span>{mvp.qtySold} sold</span></li>
                                    <li className="flex flex-row items-center justify-start gap-2"><CircleDollarSign strokeWidth={1.5} size={20} /> <span>{formatCurrencyShort(mvp.revenue)}</span></li>
                                    <li className="flex flex-row items-center justify-start gap-2"><ReceiptText strokeWidth={1.5} size={20} /> <span>{mvp.orderCount} order{mvp.orderCount > 0 ? 's' : ''}</span></li>
                                    <li className={` text-${mvp.profitPercentage >= 0 ? 'green-500' : 'red-500'} flex flex-row items-center justify-start gap-2`}>
                                        {mvp.profitPercentage >= 0 ? <TrendingUp strokeWidth={1.5} size={20} /> : <TrendingDown strokeWidth={1.5} size={20} />}
                                        <span>{mvp.profitPercentage >= 0 ? '+ ' : '- '}{formatPercentage(mvp.profitPercentage)}</span>
                                    </li>
                                </ul>
                            </div>
                        </Link>)
                        || (<div>
                            <h2 className='text-xl font-bold font-rambla font-acc-7'>No record sales within the period</h2>
                        </div>)
                    }
                </div>
                <div className="rounded-md min-h-[150px] w-full border border-neu-2 bg-white flex flex-col items-center justify-center p-3 gap-3 shadow-md">
                    <p className="text-sm text-neu-6">Most Profitable Product (MPP)</p>
                    {
                        search && <LoaderPinwheel size={40} strokeWidth={2.5} color='#2D6DBE' className='animate-spin' />
                        || (mpp && <Link className='hover:cursor-pointer hover:bg-neu-1 w-full p-2' href={`/inventory/products?query=${mpp.name}`}>
                            <div className="flex flex-row items-center justify-start gap-4">
                                <p className="font-semibold text-pri-6 text-lg font-rambla">{mpp.name}</p>
                                <ul className="grow flex flex-col gap-1">
                                    <li className="flex flex-row items-center justify-start gap-2"><ShoppingCart strokeWidth={1.5} size={20} /> <span>{mpp.qtySold} sold</span></li>
                                    <li className="flex flex-row items-center justify-start gap-2"><CircleDollarSign strokeWidth={1.5} size={20} /> <span>{formatCurrencyShort(mpp.revenue)}</span></li>
                                    <li className="flex flex-row items-center justify-start gap-2"><ReceiptText strokeWidth={1.5} size={20} /> <span>{mpp.orderCount} order{mpp.orderCount > 1 ? 's' : ''}</span></li>
                                    <li className={` text-${mpp.profitPercentage >= 0 ? 'green-500' : 'red-500'} flex flex-row items-center justify-start gap-2`}>
                                        {mpp.profitPercentage >= 0 ? <TrendingUp strokeWidth={1.5} size={20} /> : <TrendingDown strokeWidth={1.5} size={20} />}
                                        <span>{mpp.profitPercentage >= 0 ? '+ ' : '- '}{formatPercentage(mpp.profitPercentage)}</span>
                                    </li>
                                </ul>
                            </div>
                        </Link>)
                        || (<div>
                            <h2 className='text-xl font-bold font-rambla font-acc-7'>No record sales within the period</h2>
                        </div>)
                    }
                </div>
            </div>
        </div>
    )
}
export default RecentActions