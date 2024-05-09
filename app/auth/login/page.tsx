"use client";
import { useRouter } from 'next/navigation'
import React, { useState } from "react";
import backgroundImage from "./background.png";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuthStore } from "@/lib/providers/auth-store-provider";


interface LoginResponse {
    id: string;
    email: string;
    lastName: string;
    firstName: string;
    accessToken: string;
}

interface ErrorResponse {
    message: string;
}

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {loggedIn, setAuth} = useAuthStore((state) => state);
    const router = useRouter();

    React.useEffect(() => {
        if (loggedIn) {
            router.push("/inventory");
        }
    }, [loggedIn, router]);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const promise = new Promise<LoginResponse>((resolve, reject) => {
            axios.post("/api/auth/login", { email, password }).then((response) => {
                const data = response.data as LoginResponse;
                setAuth({
                    id: data.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    loggedIn: true,
                });
                resolve(data);
            }).catch((error) => {
                reject(error.response.data as ErrorResponse);
            });
        });
        toast.promise<LoginResponse,ErrorResponse>(promise, {
            pending: "Logging in...",
            success: {
                render: ({data}) => `Welcome back, ${data.firstName}`,
            },
            error: {
                render: ({data}) => data.message || "An error occurred",
            },
        });
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gray-100"
            style={{
                backgroundImage: `url(${backgroundImage.src})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
            }}
        >
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full"
            >
                <div className="mb-6">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm text-gray-700"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="mb-6">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm text-gray-700"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Log in
                </button>
            </form>
        </div>
    );
};

export default LoginPage;