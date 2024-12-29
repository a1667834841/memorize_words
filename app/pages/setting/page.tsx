"use client"

import { NavBar } from '@/components/NavBar'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useSettings } from './hooks/useSettings'
import { SettingItem } from './components/SettingItem'
import { Trash2, Volume2, Moon, Sun, Palette } from 'lucide-react'

export default function SettingPage() {
  const {
    textToSpeechEnabled,
    darkMode,
    toggleTextToSpeech,
    toggleDarkMode,
    clearAllData,
    themeColor,
    setThemeColor
  } = useSettings()

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar title="设置" />
      
      <div className="container mx-auto px-4 pt-20">
        <div className="space-y-6">
          <SettingItem
            icon={<Volume2 className="w-5 h-5" />}
            title="自动语音播报"
            description="开启后，AI回复会自动播放语音"
          >
            <Switch
              checked={textToSpeechEnabled}
              onCheckedChange={toggleTextToSpeech}
            />
          </SettingItem>

          <SettingItem
            icon={darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            title="深色模式"
            description="切换深色/浅色主题"
          >
            <Switch
              checked={darkMode}
              onCheckedChange={toggleDarkMode}
            />
          </SettingItem>

          <SettingItem
            icon={<Palette className="w-5 h-5" />}
            title="主题颜色"
            description="选择应用的主题色"
          >
            <div className="flex gap-2">
              {['blue', 'green', 'purple', 'pink'].map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full ${
                    themeColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  } bg-${color}-500`}
                  onClick={() => setThemeColor(color)}
                />
              ))}
            </div>
          </SettingItem>

          <SettingItem
            icon={<Trash2 className="w-5 h-5 text-red-500" />}
            title="清除所有数据"
            description="清除所有本地存储的数据，包括设置和历史记录"
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllData}
            >
              清除
            </Button>
          </SettingItem>
        </div>
      </div>
    </div>
  )
} 