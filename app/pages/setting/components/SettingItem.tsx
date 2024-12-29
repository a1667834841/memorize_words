import { ReactNode } from 'react'

interface SettingItemProps {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}

export function SettingItem({ icon, title, description, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="text-gray-500">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
} 