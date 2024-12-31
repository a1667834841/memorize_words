'use client'

import { useState, useRef, useEffect } from 'react'
import { ExportCardParams } from './GradientConfigurableCard'
import gradients from '@/app/data/gradients.json'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { MdOutlineConnectWithoutContact } from "react-icons/md";
import { BiBookOpen } from "react-icons/bi";
import domtoimage from "dom-to-image-more";
import JSZip from 'jszip';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Copy, Download, Share2, X, ChevronDown, ChevronUp } from 'lucide-react'

interface CardDownLoadButtonProps {
    params: Omit<ExportCardParams, 'bgColors'>
    className?: string,
    batchParams: BatchExportParams
}

interface BatchExportParams {
    words: Array<{
        title: string;
        subtitle: string;
        guidelines?: string[];
        content: string;
        source: string;
    }>;
}

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
};

export function CardDownLoadButton({ params, className, batchParams }: CardDownLoadButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedGradient, setSelectedGradient] = useState<typeof gradients.gradients[0]>(gradients.gradients[0])
    const containerRef = useRef<HTMLDivElement>(null)
    const cardRef = useRef<HTMLDivElement>(null)
    const [isBatchExporting, setIsBatchExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [totalExports, setTotalExports] = useState(0);
    const isMobile = useIsMobile();
    const [cardFont, setCardFont] = useState('')
    const [cardFontColor, setCardFontColor] = useState('white')
    const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

    const handleExport = async () => {
        if (!selectedGradient) return;

        let cardWidth = 600
        let cardHeight = 800
        let scale = 10

        try {
            const cardContainer = document.querySelector('.card-container') as HTMLElement;
            const card = document.querySelector('.card') as HTMLElement;
            if (!cardContainer || !card) return;

            // 克隆节点以避免修改原始元素
            const clonedCardContainer = cardContainer.cloneNode(true) as HTMLElement;

            // 创建临时容器
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = `${cardWidth}px`;
            tempContainer.style.height = `${cardHeight}px`;
            tempContainer.style.borderRadius = 'none';
            tempContainer.style.transform = `scale(${scale})`;  // 放大3倍 = 1800x2400
            tempContainer.style.transformOrigin = 'top left';
            document.body.appendChild(tempContainer);
            tempContainer.appendChild(clonedCardContainer);
            console.log(clonedCardContainer.style.width)
            console.log(clonedCardContainer.style.height)


            // 使用 dom-to-image 生成图片
            const dataUrl = await domtoimage.toPng(tempContainer, {
                quality: 1,
                bgcolor: null,
                width: cardWidth * scale,
                height: cardHeight * scale,
                style: {
                    outline: 'none',
                    border: 'none',
                },
                filter: (node: any) => {
                    if (node.style) {
                        node.style.outline = 'none';
                        node.style.border = 'none';
                    }
                    return true;
                }
            });

            // 清理临时元素
            document.body.removeChild(tempContainer);

            // 下载图片
            const link = document.createElement('a');
            link.download = `word-card-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();

            setIsOpen(false);
            setSelectedGradient(gradients.gradients[0]);
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const handleBatchExport = async (batchParams: BatchExportParams) => {
        if (!batchParams.words.length) return;

        setIsBatchExporting(true);
        setTotalExports(batchParams.words.length);
        setExportProgress(0);

        let cardWidth = 600
        let cardHeight = 800
        let scale = 10
        const zip = new JSZip();

        try {
            const cardContainer = document.querySelector('.card-container') as HTMLElement;
            const card = document.querySelector('.card') as HTMLElement;
            if (!cardContainer || !card) return;

            // 创建临时容器
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: -9999px;
                width: ${cardWidth}px;
                height: ${cardHeight}px;
                border-radius: none;
                transform: scale(${scale});
                transform-origin: top left;
            `;
            document.body.appendChild(tempContainer);

            for (let i = 0; i < batchParams.words.length; i++) {
                const word = batchParams.words[i];

                const randomNumber = Math.floor(Math.random() * gradients.gradients.length)

                // 克隆并更新内容
                const clonedCardContainer = cardContainer.cloneNode(true) as HTMLElement;
                clonedCardContainer.style.background = `linear-gradient(to bottom right, ${gradients.gradients[randomNumber].colors.join(', ')})`;

                // 更新克隆卡片的内容
                const titleEl = clonedCardContainer.querySelector('h2');
                const subtitleEl = clonedCardContainer.querySelector('h3');
                const guidelinesEl = clonedCardContainer.querySelectorAll('.whitespace-pre-line');

                const contentEl = clonedCardContainer.querySelector('p');
                const sourceEl = clonedCardContainer.querySelector('.text-right');

                if (titleEl) titleEl.textContent = word.title;
                if (subtitleEl) subtitleEl.textContent = word.subtitle;
                if (guidelinesEl) {
                    guidelinesEl.forEach((el, index) => {
                        el.textContent = word.guidelines?.[index] ?? '';
                    });
                }
                if (contentEl) contentEl.textContent = word.content;
                if (sourceEl) sourceEl.textContent = word.source;

                tempContainer.innerHTML = '';
                tempContainer.appendChild(clonedCardContainer);

                // 生成图片
                const dataUrl = await domtoimage.toPng(tempContainer, {
                    quality: 1,
                    bgcolor: null,
                    width: cardWidth * scale,
                    height: cardHeight * scale,
                    style: {
                        outline: 'none',
                        border: 'none',
                    },
                    filter: (node: any) => {
                        if (node.style) {
                            node.style.outline = 'none';
                            node.style.border = 'none';
                        }
                        return true;
                    }
                });

                // 将图片添加到 zip
                const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
                const fileName = `card-${word.title}-${date}.png`;
                const imageData = dataUrl.split('base64,')[1];
                zip.file(fileName, imageData, { base64: true });

                // 更新进度
                setExportProgress(i + 1);

                // 添加延迟以避免浏览器卡死
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // 清理临时元素
            document.body.removeChild(tempContainer);

            // 生成并下载 zip 文件
            const content = await zip.generateAsync({ type: 'blob' });
            const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
            const zipFileName = `word-cards-${date}.zip`;
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = zipFileName;
            link.click();
            URL.revokeObjectURL(url);

            setIsBatchExporting(false);
            setIsOpen(false);
            setSelectedGradient(gradients.gradients[0]);
        } catch (error) {
            console.error('Batch export failed:', error);
            setIsBatchExporting(false);
        }
    };

    const handleCopy = () => {
        const content = `今日单词：\n\n${params.title} ${params.subtitle}\n\n联想单词：\n${params.guidelines?.join('\n')}\n\n联想句子：\n${params.content}\n\n 大家对今天的单词还有什么奇怪的想法嘛？`;
        navigator.clipboard.writeText(content);
        toast.success('文案已复制到剪贴板');
    };

    return (
        <>
            <Toaster position="top-center" />
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "px-4 py-2 text-sm text-gray-600 bg-white/80 hover:bg-white/90 rounded-md shadow-sm transition-colors"
                )}
            // style={{ visibility: isOpen ? "hidden" : "visible" }}
            >
                导出卡片
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] "
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className={cn(
                                "w-full  flex items-center",
                                isMobile ? "flex-col  h-full" : "max-w-5xl gap-8 mx-4 flex-row h-[90vh]"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center",
                                isMobile ? "w-full h-full" : "flex-1"
                            )}>
                                <div
                                    className={cn(
                                        "card-container  overflow-hidden",
                                        isMobile ? " w-full h-full px-6  py-[3rem] aspect-[3/4]" : "w-[600px] p-12 aspect-[3/4]"
                                    )}
                                    style={{
                                        background: `linear-gradient(to bottom right, ${selectedGradient?.colors.join(', ')})`,
                                        transform: 'none',
                                        transformOrigin: 'center center',
                                    }}
                                >
                                    <div className={cn(
                                        "card rounded-2xl flex flex-col items-center justify-center text-white relative backdrop-blur-md bg-white/10 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.7)]",
                                        isMobile ? "p-12 mt-12 h-[calc(100vh-200px)]" : "p-12 h-full"
                                    )}>
                                        <div className="relative space-y-4" style={{
                                            color: cardFontColor
                                        }}>
                                            <div>
                                                <h2 className={cn(
                                                    "text-4xl font-bold mb-2",
                                                    isMobile ? "text-2xl" : ""
                                                )}>{params.title}</h2>
                                                <h3 className={cn(
                                                    "opacity-90",
                                                    isMobile ? "text-xs" : ""
                                                )}>{params.subtitle}</h3>
                                            </div>

                                            <div>
                                                <div className="flex items-center mb-2">
                                                    <MdOutlineConnectWithoutContact className={cn(
                                                        "text-xl flex-shrink-0",
                                                        isMobile ? "text-base" : ""
                                                    )} />
                                                    <span className={cn(
                                                        "text-lg font-bold ml-2"
                                                    )}>联想单词</span>
                                                </div>
                                                {params.guidelines?.map((guideline, index) => (
                                                    <h3 key={index} className={cn(
                                                        "opacity-80 border-l-2 border-white/50 pl-2 mb-2 whitespace-pre-line",
                                                        isMobile ? "text-xs" : ""
                                                    )}>{guideline}</h3>
                                                ))}
                                            </div>

                                            <div>
                                                <div className="flex items-center mb-2">
                                                    <BiBookOpen className="text-xl flex-shrink-0" />
                                                    <span className="text-lg font-bold ml-2">联想句子</span>
                                                </div>
                                                <p className="opacity-90 leading-relaxed text-sm leading-relaxed bg-white/5 p-4 rounded-lg">{params.content}</p>
                                            </div>
                                            <div className="text-right text-sm opacity-70">{params.source}</div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                            <div className={cn(
                                "bg-white/20 backdrop-blur-md rounded-lg shadow-lg overflow-hidden flex flex-col",
                                isMobile ? "fixed bottom-0 left-0 right-0" : "w-[450px] h-[90vh] overflow-y-auto",
                            )}>
                                <div className="p-1 flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-white p-2">选择配色方案</h3>

                                    <button
                                        onClick={() => {
                                            if (isMobile) {
                                                setIsConfigCollapsed(!isConfigCollapsed)
                                            } else {
                                                setIsOpen(false)
                                            }
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-full"
                                    >
                                        {isMobile && (
                                            isConfigCollapsed ? (
                                                <ChevronUp className="w-5 h-5 text-white" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-white" />
                                            )
                                        )}
                                        {!isMobile && <X className="w-5 h-5 text-white" />}
                                    </button>
                                </div>

                                <AnimatePresence initial={false}>
                                    {(!isConfigCollapsed || !isMobile) && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: "auto" }}
                                            exit={{ height: 0 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 30,
                                                mass: 0.8
                                            }}
                                            className="overflow-hidden"
                                        >
                                            <div className={cn(
                                                "overflow-y-auto custom-scrollbar overflow-x-auto",
                                                isMobile ? "flex gap-3  h-auto" : "grid grid-cols-2 gap-2 h-[calc(50vh)] "
                                            )}>
                                                {gradients.gradients.map((gradient, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setSelectedGradient(gradient)}
                                                        className={cn(
                                                            "group p-2 rounded transition-colors text-left flex-shrink-0",
                                                            isMobile ? "w-[100px]" : ""
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-full rounded-md mb-1 hover:ring-2 hover:ring-white",
                                                                isMobile ? "h-16" : "h-12",
                                                                selectedGradient?.name === gradient.name && "ring-2 ring-white"
                                                            )}
                                                            style={{
                                                                background: `linear-gradient(to right, ${gradient.colors.join(', ')})`
                                                            }}
                                                        />
                                                        <span className="text-xs text-white line-clamp-1 text-center">
                                                            {gradient.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-4">
                                                <label className="text-sm text-white mb-2 block">字体颜色</label>
                                                <div className="grid grid-cols-5 gap-1">
                                                    {['white', '#414345', 'green', 'red'].map(color => (
                                                        <button
                                                            key={color}
                                                            onClick={() => setCardFontColor(color)}
                                                            className={`w-8 h-8 rounded-full ${cardFontColor === color ? 'ring-2 ring-white' : ''}`}
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-xs text-white mt-2">
                                                    <span>当前颜色: {cardFontColor}</span>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                isMobile
                                                    ? "p-2 grid grid-cols-2 gap-4 mb-2"
                                                    : "p-3 grid grid-cols-2 gap-4 max-h-[250px]  custom-scrollbar overflow-x-auto"
                                            )}>

                                                <button
                                                    onClick={handleCopy}
                                                    className="px-4 py-2 text-lg bg-white/20 text-white rounded-md hover:bg-white/30 flex items-center justify-center gap-2"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    复制文案
                                                </button>
                                                <button
                                                    onClick={handleExport}
                                                    className={cn(
                                                        "px-4 py-2 text-lg bg-white/20 text-white rounded-md hover:bg-white/30 flex items-center justify-center gap-2",
                                                    )}
                                                >
                                                    <Download className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
                                                    下载
                                                </button>

                                                <button
                                                    onClick={() => handleBatchExport(batchParams)}
                                                    className="px-4 py-2 text-lg bg-white/20 text-white rounded-md hover:bg-white/30 flex items-center justify-center gap-2"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                    批量导出
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsOpen(false)
                                                        setSelectedGradient(gradients.gradients[0])
                                                    }}
                                                    className="px-4 py-2 text-lg bg-white/20 text-white rounded-md hover:bg-white/30 flex items-center justify-center gap-2"
                                                >
                                                    <X className="h-4 w-4" />
                                                    关闭
                                                </button>

                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isBatchExporting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]"
                >
                    <div className="bg-white rounded-lg p-6 w-[400px]">
                        <h3 className="text-lg font-medium mb-4">正在导出卡片...</h3>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(exportProgress / totalExports) * 100}%` }}
                            />
                        </div>
                        <div className="text-sm text-gray-600">
                            已完成 {exportProgress} / {totalExports}
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    )
}
