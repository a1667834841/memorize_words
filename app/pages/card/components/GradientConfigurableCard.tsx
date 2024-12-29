'use client'

import React, { useState, useRef } from 'react';
import { HexColorPicker } from "react-colorful";
import html2canvas from 'html2canvas';

interface CardProps {
  initialTitle: string;
  initialSubtitle: string;
  initialContent: string;
  initialSource: string;
  initialBgColor1: string;
  initialBgColor2: string;
  initialCardColor1: string;
  initialCardColor2: string;
}

interface ExportCardParams {
  title?: string;
  subtitle?: string;
  guidelines?: string[];
  content?: string;
  source?: string;
  bgColors?: string[];
}

// 将函数提取到组件外部
export const exportCardWithParams = async (params: ExportCardParams) => {
  const previewCard = document.querySelector('.preview-card') as HTMLElement;
  if (!previewCard) return;

  try {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    const exportCard = previewCard.cloneNode(true) as HTMLElement;
    exportCard.style.width = '420px';
    exportCard.style.height = '560px';

    // 更新卡片内容
    const titleElement = exportCard.querySelector('h2');
    const subtitleElement = exportCard.querySelector('h3');
    const contentElement = exportCard.querySelector('p');
    const sourceElement = exportCard.querySelector('.text-right');

    if (titleElement && params.title) titleElement.textContent = params.title;
    if (subtitleElement && params.subtitle) subtitleElement.textContent = params.subtitle;
    if (contentElement && params.content) contentElement.textContent = params.content;
    if (sourceElement && params.source) sourceElement.textContent = params.source;

    tempContainer.appendChild(exportCard);

    // 确保背景色和渐变效果被正确应用
    tempContainer.style.background = `linear-gradient(to bottom right, ${params.bgColors?.join(', ') || '#4A00E0, #8E2DE2'})`;
    tempContainer.style.width = '540px';
    tempContainer.style.height = '720px';
    tempContainer.style.display = 'flex';
    tempContainer.style.alignItems = 'center';
    tempContainer.style.justifyContent = 'center';
    tempContainer.style.padding = '20px 35px';

    // 使用 html2canvas 捕获临时容器
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
    });

    // 清理临时容器
    document.body.removeChild(tempContainer);

    // 导出图片
    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = 'gradient-card.png';
    link.href = image;
    link.click();
  } catch (error) {
    console.error('Export failed:', error);
  }
};

const GradientConfigurableCard: React.FC<CardProps> = ({
  initialTitle,
  initialSubtitle,
  initialContent,
  initialSource,
  initialBgColor1,
  initialBgColor2,
  initialCardColor1,
  initialCardColor2
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [content, setContent] = useState(initialContent);
  const [source, setSource] = useState(initialSource);
  const [bgColor1, setBgColor1] = useState(initialBgColor1);
  const [bgColor2, setBgColor2] = useState(initialBgColor2);
  const [cardColor1, setCardColor1] = useState(initialCardColor1);
  const [cardColor2, setCardColor2] = useState(initialCardColor2);
  const [activeColor, setActiveColor] = useState<'bg1' | 'bg2' | 'card1' | 'card2' | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleColorChange = (color: string) => {
    switch (activeColor) {
      case 'bg1': setBgColor1(color); break;
      case 'bg2': setBgColor2(color); break;
      case 'card1': setCardColor1(color); break;
      case 'card2': setCardColor2(color); break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'bg1' | 'bg2' | 'card1' | 'card2') => {
    const color = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(color)) {
      switch (type) {
        case 'bg1': setBgColor1(color); break;
        case 'bg2': setBgColor2(color); break;
        case 'card1': setCardColor1(color); break;
        case 'card2': setCardColor2(color); break;
      }
    }
  };

  // 原有的导出方法现在调用新方法
  const exportCard = () => exportCardWithParams({
    title: title,
    subtitle: subtitle,
    content: content,
    source: source
  });

  const ColorInput = ({ color, onChange, onClick, label }: { color: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onClick: () => void; label: string }) => (
    <div className="flex items-center space-x-2">
      <button
        onClick={onClick}
        className="w-6 h-6 rounded-full border-2 border-gray-300"
        style={{ background: `linear-gradient(to bottom right, ${color}, ${color})` }}
      ></button>
      <input
        type="text"
        value={color}
        onChange={onChange}
        className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1"
        placeholder={label}
      />
    </div>
  );

  const TextInput = ({ value, onChange, label }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; label: string }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {label === '正文' ? (
        <textarea
          value={value}
          onChange={onChange}
          className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="bg-white border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1"
        />
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(to bottom right, ${bgColor1}, ${bgColor2})` }}
      ref={exportRef}
    >
      <div className="w-full max-w-sm aspect-[3/4] rounded-3xl shadow-2xl overflow-hidden preview-card">
        <div className="h-full w-full relative" style={{ background: `linear-gradient(to bottom right, ${cardColor1}66, ${cardColor2}66)` }}>
          <div className="absolute inset-0 backdrop-blur-xl"></div>
          <div className="relative h-full flex flex-col justify-between p-6 text-white z-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">{title}</h2>
              <h3 className="text-xl font-semibold opacity-80 mb-4">{subtitle}</h3>
              <p className="text-lg opacity-90">{content}</p>
            </div>
            <div className="text-right text-sm opacity-70">{source}</div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 z-20">
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="bg-white text-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
      {isConfigOpen && (
        <div className="absolute bottom-16 right-4 bg-white p-4 rounded-lg shadow-lg space-y-4 z-10 max-h-[80vh] overflow-y-auto">
          <h4 className="text-sm font-semibold mb-2">文字内容</h4>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} label="大标题" />
          <TextInput value={subtitle} onChange={(e) => setSubtitle(e.target.value)} label="副标题" />
          <TextInput value={content} onChange={(e) => setContent(e.target.value)} label="正文" />
          <TextInput value={source} onChange={(e) => setSource(e.target.value)} label="来源" />
          <h4 className="text-sm font-semibold mb-2">背景颜色</h4>
          <ColorInput color={bgColor1} onChange={(e) => handleInputChange(e, 'bg1')} onClick={() => setActiveColor('bg1')} label="左上角" />
          <ColorInput color={bgColor2} onChange={(e) => handleInputChange(e, 'bg2')} onClick={() => setActiveColor('bg2')} label="右下角" />
          <h4 className="text-sm font-semibold mb-2">卡片颜色</h4>
          <ColorInput color={cardColor1} onChange={(e) => handleInputChange(e, 'card1')} onClick={() => setActiveColor('card1')} label="左上角" />
          <ColorInput color={cardColor2} onChange={(e) => handleInputChange(e, 'card2')} onClick={() => setActiveColor('card2')} label="右下角" />
          <button
            onClick={exportCard}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            导出卡片图片 (1080x1440)
          </button>
        </div>
      )}
      {activeColor && (
        <div className="absolute bottom-16 right-4 bg-white p-4 rounded-lg shadow-lg z-30">
          <HexColorPicker
            color={
              activeColor === 'bg1' ? bgColor1 :
                activeColor === 'bg2' ? bgColor2 :
                  activeColor === 'card1' ? cardColor1 :
                    cardColor2
            }
            onChange={handleColorChange}
          />
          <button
            onClick={() => setActiveColor(null)}
            className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};

export { GradientConfigurableCard, type ExportCardParams };
export default GradientConfigurableCard;

