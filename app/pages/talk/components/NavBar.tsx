import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function NavBar() {
  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow-md">
      <Link href="/" className="text-gray-600 hover:text-gray-800">
        <ArrowLeft size={24} />
      </Link>
      <h1 className="text-xl font-bold text-center">
        <span role="img" aria-label="可爱女生表情">👧</span> copi
      </h1>
      <div className="w-8" />
    </nav>
  )
} 