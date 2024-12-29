"use client"

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavBarProps {
    title: string
    subtitle?: string
    className?: string
}

export function NavBar({ title, subtitle, className }: NavBarProps) {
    const router = useRouter()

    return (
        <div className={`fixed top-0 left-0 right-0 bg-white shadow-sm z-10 ${className}`}>
            <div className="mx-auto px-4 h-14 items-center justify-between">
                <button
                    onClick={() => router.push('/')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center justify-center w-full h-14">
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
                </div>
            </div>
        </div>
    )
}
