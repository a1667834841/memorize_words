'use client'

import { useState, useRef, useEffect } from 'react'
import { ExportCardParams } from './GradientConfigurableCard'
import gradients from '@/app/data/gradients.json'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { MdFileDownload, MdOutlineConnectWithoutContact } from "react-icons/md";
import { BiBookOpen } from "react-icons/bi";
import domtoimage from "dom-to-image-more";
import JSZip from 'jszip';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Copy, Download, Share2, X, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './CardCanvas.module.css'
import { backgroundImage } from 'html2canvas/dist/types/css/property-descriptors/background-image'

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
        // 确保所有必要的参数都存在
        if (!canvasRef.current || !selectedGradient || !params) return

        // 添加一个小延时确保DOM完全加载
        const timer = setTimeout(() => {
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d', { alpha: false })
            if (!ctx) return

            // 设置固定大小
            canvas.width = 900
            canvas.height = 1200

            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // 绘制背景渐变
            const backgroundGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            selectedGradient.colors.forEach((color, index) => {
                backgroundGradient.addColorStop(index / (selectedGradient.colors.length - 1), color)
            })
            ctx.fillStyle = backgroundGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // 绘制半透明卡片背景（带阴影和毛玻璃效果）
            const cardMargin = 80
            const cardHeightMargin = 60
            const cardWidth = canvas.width - (cardMargin * 2)
            const cardHeight = canvas.height - (cardHeightMargin * 2)

            // 保存上下文状态
            ctx.save()

            // 1. 先绘制带强阴影的不透明底层
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
            ctx.shadowBlur = 30
            ctx.shadowOffsetY = 20
            // ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.beginPath()
            ctx.roundRect(cardMargin, cardMargin, cardWidth, cardHeight, 20)
            ctx.fill()

            // 2. 清除阴影设置
            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.shadowOffsetY = 0

            // 3. 添加毛玻璃效果层
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            // ctx.filter = 'blur(30px)'  // 添加模糊效果
            ctx.beginPath()
            ctx.roundRect(cardMargin, cardMargin, cardWidth, cardHeight, 20)
            ctx.fill()


            // 恢复上下文状态
            ctx.restore()



            // 文字渲染设置
            ctx.textBaseline = 'top'
            ctx.fillStyle = cardFontColor
            let currentY = cardMargin + 80

            // 绘制标题
            ctx.font = 'bold 100px sans-serif'
            ctx.fillText(params.title || '', cardMargin + 60, currentY)
            currentY += 120

            // 绘制副标题
            ctx.font = '40px sans-serif'
            ctx.fillText(params.subtitle || '', cardMargin + 60, currentY)
            currentY += 100

            // 绘制联想单词图标和标题
            ctx.save()
            // 绘制联想图标 SVG
            const connectIcon = new Path2D()
            connectIcon.moveTo(cardMargin + 60, currentY + 20)
            connectIcon.arc(cardMargin + 75, currentY + 20, 15, 0, Math.PI * 2)
            connectIcon.moveTo(cardMargin + 90, currentY + 20)
            connectIcon.lineTo(cardMargin + 105, currentY + 20)
            connectIcon.arc(cardMargin + 90, currentY + 20, 15, 0, Math.PI * 2)
            ctx.strokeStyle = cardFontColor
            ctx.lineWidth = 2
            ctx.stroke(connectIcon)

            // 绘制"联想单词"文本
            ctx.font = 'bold 40px sans-serif'
            ctx.fillStyle = cardFontColor
            ctx.fillText('联想单词', cardMargin + 120, currentY)
            currentY += 80
            ctx.restore()

            // 绘制联想单词列表（带换行）
            ctx.font = '32px sans-serif'
            ctx.globalAlpha = 0.9
            const guidelineMaxWidth = cardWidth - 180 // 减去左边距和一些空间

            params.guidelines?.forEach(guideline => {
                if (!guideline) return

                // 文字换行处理
                const words = guideline.split('')
                let line = ''
                let lineY = currentY
                const lineHeight = 40

                // 绘制左边框
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
                ctx.fillRect(cardMargin + 60, currentY + 8, 3, 24)

                // 绘制文字（带换行）
                ctx.fillStyle = cardFontColor
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i]
                    const metrics = ctx.measureText(testLine)
                    if (metrics.width > guidelineMaxWidth && i > 0) {
                        ctx.fillText(line, cardMargin + 80, lineY)
                        line = words[i]
                        lineY += lineHeight
                    } else {
                        line = testLine
                    }
                }
                if (line) {
                    ctx.fillText(line, cardMargin + 80, lineY)
                    lineY += lineHeight
                }

                currentY = lineY + 10
            })
            currentY += 40

            // 绘制联想句子图标和标题
            ctx.save()
            // 绘制书本图标 SVG
            const bookIcon = new Path2D()
            bookIcon.moveTo(cardMargin + 60, currentY + 10)
            bookIcon.lineTo(cardMargin + 90, currentY + 10)
            bookIcon.lineTo(cardMargin + 90, currentY + 30)
            bookIcon.lineTo(cardMargin + 60, currentY + 30)
            bookIcon.closePath()
            // 书本折痕
            bookIcon.moveTo(cardMargin + 75, currentY + 10)
            bookIcon.lineTo(cardMargin + 75, currentY + 30)
            ctx.strokeStyle = cardFontColor
            ctx.lineWidth = 2
            ctx.stroke(bookIcon)

            // 绘制"联想句子"文本
            ctx.font = 'bold 40px sans-serif'
            ctx.fillStyle = cardFontColor
            ctx.fillText('联想句子', cardMargin + 120, currentY)
            currentY += 80
            ctx.restore()

            // 计算句子内容的实际高度
            const words = (params.content || '').split('')
            let line = ''
            let contentHeight = 0
            const sentenceBoxWidth = cardWidth - 120
            const maxWidth = sentenceBoxWidth - 60 // 减去内边距
            const lineHeight = 45

            // 先计算高度
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i]
                const metrics = ctx.measureText(testLine)
                if (metrics.width > maxWidth) {
                    contentHeight += lineHeight
                    line = words[i]
                } else {
                    line = testLine
                }
            }
            contentHeight += lineHeight + 60 // 加上最后一行和上下内边距

            // 绘制句子背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.beginPath()
            ctx.roundRect(
                cardMargin + 60,
                currentY,
                sentenceBoxWidth,
                Math.max(contentHeight, 250), // 确保最小高度
                10
            )
            ctx.fill()

            // 绘制句子内容
            ctx.font = '32px sans-serif'
            ctx.letterSpacing = '2px'
            ctx.fillStyle = cardFontColor
            ctx.globalAlpha = 0.9

            // 重置变量开始绘制文本
            line = ''
            let contentY = currentY + 30 // 上内边距

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i]
                const metrics = ctx.measureText(testLine)
                if (metrics.width > maxWidth) {
                    ctx.fillText(line, cardMargin + 90, contentY)
                    contentY += lineHeight
                    line = words[i]
                } else {
                    line = testLine
                }
            }
            if (line) {
                ctx.fillText(line, cardMargin + 90, contentY)
                contentY += lineHeight
            }

            currentY += Math.max(contentHeight, 200) + 40

            // 绘制来源
            ctx.font = '28px sans-serif'
            ctx.globalAlpha = 0.7
            const source = params.source || ''
            const sourceMetrics = ctx.measureText(source)
            ctx.fillText(
                source,
                cardMargin + cardWidth - sourceMetrics.width - 60,
                currentY
            )
        }, 100)

        // 清理函数
        return () => clearTimeout(timer)
    }, [selectedGradient, params, cardFontColor, isOpen])

    const handleExport = async () => {
        if (!canvasRef.current) return

        try {
            const dataUrl = canvasRef.current.toDataURL('image/png')
            const link = document.createElement('a')
            link.download = `word-card-${Date.now()}.png`
            link.href = dataUrl
            link.click()

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
                setSelectedGradient(randomGradient)

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
                        // initial={{ opacity: 0.5 }}
                        // animate={{ opacity: 1 }}
                        // exit={{ opacity: 0.5 }}
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
                                        className={styles.canvas} style={{ aspectRatio: '3/4' }}
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
