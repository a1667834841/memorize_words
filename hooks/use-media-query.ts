import { useState, useEffect } from 'react';

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // 正则表达式匹配常见的移动设备标识
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // 检查屏幕宽度是否小于某个阈值（例如 768px）
  const isSmallScreen = window.innerWidth < 768;
  
  return mobileRegex.test(userAgent.toLowerCase()) || isSmallScreen;
}