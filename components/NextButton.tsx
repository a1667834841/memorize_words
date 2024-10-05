import React from 'react'
import { Page,pages } from './app-router'

interface NextButtonProps {
  page:Page
  navigateTo: (page: Page) => void;
}

export const NextButton: React.FC<NextButtonProps> = ({ page,navigateTo }) => {
  return (
    <button 
      onClick={() => navigateTo(page)}
      className="absolute top-5 right-5 p-2 bg-gray-200 hover:bg-gray-300 rounded-full"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </button>
  )
}