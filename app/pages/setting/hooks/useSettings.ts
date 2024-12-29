import { useState, useEffect } from 'react'

interface Settings {
  textToSpeechEnabled: boolean
  darkMode: boolean
  themeColor: string
}

const DEFAULT_SETTINGS: Settings = {
  textToSpeechEnabled: true,
  darkMode: false,
  themeColor: 'blue'
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  // 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // 保存设置
  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings)
    localStorage.setItem('settings', JSON.stringify(newSettings))
  }

  const toggleTextToSpeech = () => {
    saveSettings({
      ...settings,
      textToSpeechEnabled: !settings.textToSpeechEnabled
    })
  }

  const toggleDarkMode = () => {
    saveSettings({
      ...settings,
      darkMode: !settings.darkMode
    })
    // 更新文档根元素的 class
    if (!settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const setThemeColor = (color: string) => {
    saveSettings({
      ...settings,
      themeColor: color
    })
  }

  const clearAllData = () => {
    // 清除所有本地存储
    localStorage.clear()
    // 重置设置
    setSettings(DEFAULT_SETTINGS)
  }

  return {
    ...settings,
    toggleTextToSpeech,
    toggleDarkMode,
    setThemeColor,
    clearAllData
  }
} 