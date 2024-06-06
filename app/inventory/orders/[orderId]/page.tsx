"use client"
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Invoice from "../components/invoice"

export default function Order() {
    return (
        <div className="flex flex-col absolute h-[calc(100vh-60px)] top-[60px] w-full border border-red-500">
            <div className="h-full relative">
                <Dialog>
                    <DialogTrigger>Preview Invoice</DialogTrigger>
                    <DialogContent className="max-w-full w-[80vw] min-h-[100vh] overflow-scroll">
                        <DialogHeader>
                            <div>
                                <Invoice/>
                            </div>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}