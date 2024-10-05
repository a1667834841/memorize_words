import React from 'react'
import { Page,pages } from './app-router'

interface BackButtonProps {
  page:Page
  navigateTo: (page: Page) => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ page,navigateTo }) => {
  return (
    <button 
      onClick={() => navigateTo(page)}
      className="absolute top-5 left-5 p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-6 sm:w-6 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>
  )
}