'use client'

import { useState, useRef, useEffect } from 'react'
import { ExportCardParams } from './GradientConfigurableCard'
import gradients from '@/app/data/gradients.json'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { BiBookOpen } from "react-icons/bi"
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { Copy, Download, Share2, X } from 'lucide-react'
import styles from './CardCanvas.module.css'
import { CardCanvas, CANVAS_CONFIG } from './CardCanvas'
import JSZip from 'jszip'

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
    const [selectedGradient, setSelectedGradient] = useState(() => gradients.gradients[0])
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isBatchExporting, setIsBatchExporting] = useState(false)
    const [exportProgress, setExportProgress] = useState(0)
    const [totalExports, setTotalExports] = useState(0)
    const isMobile = useIsMobile()
    const [cardFontColor, setCardFontColor] = useState('white')

    useEffect(() => {
        if (!canvasRef.current || !selectedGradient || !params) return

        const timer = setTimeout(() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d', { alpha: false })
            if (!ctx) return

            // 设置 canvas 的样式以保持显示尺寸
            canvas.style.width = '100%'
            canvas.style.height = '100%'
            canvas.style.objectFit = 'contain'

            // 使用新的 CardCanvas 类
            const cardCanvas = new CardCanvas(ctx, selectedGradient, params, cardFontColor)
            cardCanvas.draw()
        }, 100)

        return () => clearTimeout(timer)
    }, [selectedGradient, params, cardFontColor,isOpen])

    const handleExport = async () => {
        if (!canvasRef.current) return

        try {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d', { alpha: false })
            if (!ctx) return

            // 使用高分辨率重新绘制
            const cardCanvas = new CardCanvas(ctx, selectedGradient, params, cardFontColor)
            cardCanvas.draw(CANVAS_CONFIG.exportScaleFactor)

            const dataUrl = canvas.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `word-card-${Date.now()}.png`
            link.href = dataUrl
            link.click()

            // 恢复预览分辨率
            cardCanvas.draw()

            setIsOpen(false)
            setSelectedGradient(gradients.gradients[0])
        } catch (error) {
            console.error('Export failed:', error)
            toast.error('导出失败，请重试')
        }
    }

    const handleBatchExport = async (batchParams: BatchExportParams) => {
        if (!batchParams.words.length || !canvasRef.current) return

        setIsBatchExporting(true)
        setTotalExports(batchParams.words.length)
        setExportProgress(0)

        const zip = new JSZip()
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        try {
            for (let i = 0; i < batchParams.words.length; i++) {
                const word = batchParams.words[i]
                const randomGradient = gradients.gradients[Math.floor(Math.random() * gradients.gradients.length)]

                // 使用高分辨率绘制
                const cardCanvas = new CardCanvas(ctx, randomGradient, word, cardFontColor)
                cardCanvas.draw(CANVAS_CONFIG.exportScaleFactor)

                // 等待canvas重绘
                await new Promise(resolve => setTimeout(resolve, 100))

                const dataUrl = canvas.toDataURL('image/png')
                const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
                const fileName = `card-${word.title}-${date}.png`
                const imageData = dataUrl.split('base64,')[1]
                zip.file(fileName, imageData, { base64: true })

                setExportProgress(i + 1)
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            const content = await zip.generateAsync({ type: 'blob' })
            const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')
            const zipFileName = `word-cards-${date}.zip`
            const url = URL.createObjectURL(content)
            const link = document.createElement('a')
            link.href = url
            link.download = zipFileName
            link.click()
            URL.revokeObjectURL(url)

            // 恢复预览分辨率
            const cardCanvas = new CardCanvas(ctx, selectedGradient, params, cardFontColor)
            cardCanvas.draw()

            setIsBatchExporting(false)
            setIsOpen(false)
            setSelectedGradient(gradients.gradients[0])
        } catch (error) {
            console.error('Batch export failed:', error)
            setIsBatchExporting(false)
        }
    }

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
                    "p-3 rounded-full text-gray-600 bg-white hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
                )}
            >
                <BiBookOpen className="text-xl text-blue-600" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.1 }}
                            exit={{ scale: 0.95 }}
                            className={cn(
                                "w-full flex items-start relative z-[1000] flex-col",
                                isMobile ? "h-full" : "max-w-4xl mx-4 h-[100vh]"
                            )}
                        >
                            <div className={cn(
                                "operation-panel-up flex items-center justify-center w-full",
                                isMobile ? "h-[60vh]" : "h-[60vh]"
                            )}>
                                <div className={styles.canvasContainer}>
                                    <canvas
                                        ref={canvasRef}
                                        className={styles.canvas}
                                        style={{ aspectRatio: '3/4' }}
                                    />
                                </div>
                            </div>
                            <div className={cn(
                                "operation-panel-down bg-white/20 backdrop-blur-md rounded-lg shadow-lg w-full p-4",
                                isMobile ? "h-[40vh]" : "h-[40vh]"
                            )}>
                                <div className="flex flex-col gap-2 h-full">
                                    <div className="h-[33.33%]">
                                        <div className="text-xs text-white mb-2">渐变色选择</div>
                                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                            {gradients.gradients.map((gradient, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedGradient(gradient)}
                                                    className="flex-shrink-0"
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-8 h-8 rounded-full hover:ring-2 hover:ring-white mb-1",
                                                            selectedGradient?.name === gradient.name && "ring-2 ring-white"
                                                        )}
                                                        style={{
                                                            background: `linear-gradient(to right, ${gradient.colors.join(', ')})`
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-white line-clamp-1 text-center w-12">
                                                        {gradient.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-[33.33%]">
                                        <div className="text-xs text-white mb-2">字体颜色</div>
                                        <div className="flex gap-4">
                                            {['white', '#414345', 'green', 'red'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setCardFontColor(color)}
                                                    className="flex flex-col items-center"
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full hover:ring-2 hover:ring-white",
                                                        cardFontColor === color && "ring-2 ring-white"
                                                    )}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    <span className="text-[10px] text-white mt-1">
                                                        {color === '#414345' ? '黑色' :
                                                            color === 'white' ? '白色' :
                                                                color === 'green' ? '绿色' : '红色'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-[33.33%]">
                                        <div className="text-xs text-white mb-2">操作</div>
                                        <div className="flex justify-around">
                                            <button
                                                onClick={handleCopy}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center mb-2">
                                                    <Copy className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-[10px] text-white whitespace-nowrap">复制文案</span>
                                            </button>
                                            <button
                                                onClick={handleExport}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center mb-2">
                                                    <Download className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-[10px] text-white whitespace-nowrap">下载</span>
                                            </button>
                                            <button
                                                onClick={() => handleBatchExport(batchParams)}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center mb-2">
                                                    <Share2 className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-[10px] text-white whitespace-nowrap">批量导出</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false)
                                                    setSelectedGradient(gradients.gradients[0])
                                                }}
                                                className="flex flex-col items-center"
                                            >
                                                <div className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center mb-2">
                                                    <X className="h-4 w-4 text-white" />
                                                </div>
                                                <span className="text-[10px] text-white whitespace-nowrap">关闭</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
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
