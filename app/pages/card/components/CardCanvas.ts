import { ExportCardParams } from './GradientConfigurableCard'

// Canvas 配置项
export const CANVAS_CONFIG = {
    width: 900,
    height: 1200,
    cardMargin: 80,
    titleFontSize: 100,
    subtitleFontSize: 40,
    contentFontSize: 32,
    sourceFontSize: 28,
    lineHeight: 45,
    iconSize: 30,
    scaleFactor: 1,
    exportScaleFactor: 3,
    padding: {
        content: 60,
        text: 30,
        card: {
            top: 100,
            bottom: 60,
            left: 80,
            right: 80
        },
        section: {
            top: 40,
            bottom: 40,
            left: 60,
            right: 60
        }
    }
}

export class CardCanvas {
    private ctx: CanvasRenderingContext2D
    private gradient: any
    private params: Omit<ExportCardParams, 'bgColors'>
    private fontColor: string
    private cardWidth: number
    private totalHeight: number
    private contentHeight: number
    private sectionHeight: number
    private displayWidth: number
    private displayHeight: number

    constructor(
        ctx: CanvasRenderingContext2D,
        gradient: any,
        params: Omit<ExportCardParams, 'bgColors'>,
        fontColor: string
    ) {
        this.ctx = ctx
        this.gradient = gradient
        this.params = params
        this.fontColor = fontColor
        this.displayWidth = CANVAS_CONFIG.width
        this.displayHeight = CANVAS_CONFIG.height
        this.cardWidth = (CANVAS_CONFIG.width - (CANVAS_CONFIG.cardMargin * 2)) * CANVAS_CONFIG.scaleFactor
        this.totalHeight = this.calculateTotalHeight()
        this.contentHeight = this.totalHeight - (CANVAS_CONFIG.cardMargin * 2 * CANVAS_CONFIG.scaleFactor)
        this.sectionHeight = this.contentHeight / 5
    }

    public draw(scale: number = CANVAS_CONFIG.scaleFactor): void {
        // 设置实际 canvas 尺寸
        this.ctx.canvas.width = CANVAS_CONFIG.width * scale
        this.ctx.canvas.height = this.totalHeight * scale

        // 设置显示尺寸（CSS尺寸）
        this.ctx.canvas.style.width = `${CANVAS_CONFIG.width}px`
        this.ctx.canvas.style.height = `${this.totalHeight}px`

        // 应用缩放
        this.ctx.scale(scale, scale)

        // 清除画布
        this.ctx.clearRect(0, 0, this.ctx.canvas.width / scale, this.ctx.canvas.height / scale)

        // 绘制各个部分
        this.drawBackground()
        this.drawCardContainer()
        this.drawContent()

        // 重置缩放
        this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    private drawBackground(): void {
        const backgroundGradient = this.ctx.createLinearGradient(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height)
        this.gradient.colors.forEach((color: string, index: number) => {
            backgroundGradient.addColorStop(index / (this.gradient.colors.length - 1), color)
        })
        this.ctx.fillStyle = backgroundGradient
        this.ctx.fillRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height)
    }

    private drawCardContainer(): void {
        const cardHeight = this.totalHeight - (CANVAS_CONFIG.padding.card.top + CANVAS_CONFIG.padding.card.bottom)
        this.ctx.save()

        // 底层阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        this.ctx.shadowBlur = 30
        this.ctx.shadowOffsetY = 20
        this.ctx.beginPath()
        this.ctx.roundRect(
            CANVAS_CONFIG.padding.card.left,
            CANVAS_CONFIG.padding.card.top,
            this.cardWidth,
            cardHeight,
            20
        )
        this.ctx.fill()

        // 毛玻璃效果层
        this.ctx.shadowColor = 'transparent'
        this.ctx.shadowBlur = 0
        this.ctx.shadowOffsetY = 0
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        this.ctx.beginPath()
        this.ctx.roundRect(
            CANVAS_CONFIG.padding.card.left,
            CANVAS_CONFIG.padding.card.top,
            this.cardWidth,
            cardHeight,
            20
        )
        this.ctx.fill()
        this.ctx.restore()
    }

    private drawContent(): void {
        // 计算每个部分的固定高度
        const sectionHeights = {
            title: this.sectionHeight,  // 1/5
            association: this.sectionHeight,  // 1/5
            sentence: this.sectionHeight * 2,  // 2/5
            source: this.sectionHeight  // 1/5
        }

        let currentY = CANVAS_CONFIG.padding.card.top + 50

        // 1. 标题部分 (1/5)
        currentY = this.drawTitleSection(currentY, sectionHeights.title) + 20

        // 2. 联想单词部分 (1/5)
        currentY = this.drawAssociationSection(currentY, sectionHeights.association) + 40

        // 3. 联想句子部分 (2/5)
        currentY = this.drawSentenceSection(currentY, sectionHeights.sentence)

        // 4. 来源部分 (1/5)
        this.drawSourceSection(currentY)
    }

    private drawTitleSection(startY: number, sectionHeight: number): number {
        this.ctx.textBaseline = 'top'
        this.ctx.fillStyle = this.fontColor

        const titleHeight = sectionHeight * 0.6  // 标题占60%
        const subtitleHeight = sectionHeight * 0.4  // 副标题占40%

        // 标题
        this.ctx.font = `bold ${CANVAS_CONFIG.titleFontSize}px sans-serif`
        this.ctx.fillText(
            this.params.title || '',
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left,
            startY + (titleHeight - CANVAS_CONFIG.titleFontSize) / 2
        )

        // 副标题
        this.ctx.font = `${CANVAS_CONFIG.subtitleFontSize}px sans-serif`
        this.ctx.fillText(
            this.params.subtitle || '',
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left,
            startY + titleHeight + (subtitleHeight - CANVAS_CONFIG.subtitleFontSize) / 2
        )

        return startY + sectionHeight
    }

    private drawAssociationSection(startY: number, sectionHeight: number): number {
        this.ctx.save()

        // 标题和图标部分
        const headerHeight = 60
        const iconSize = 30
        const titleY = startY + (headerHeight - CANVAS_CONFIG.subtitleFontSize) / 2
        const iconY = titleY + CANVAS_CONFIG.subtitleFontSize / 2 - iconSize / 2  // 图标中心对齐到文字中心

        // 绘制图标
        this.drawConnectIcon(
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left,
            iconY
        )

        // 绘制标题
        this.ctx.font = `bold ${CANVAS_CONFIG.subtitleFontSize}px sans-serif`
        this.ctx.fillStyle = this.fontColor
        this.ctx.fillText(
            '联想单词',
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left + 60,
            titleY
        )

        // 计算内容区域
        const contentAreaHeight = sectionHeight - headerHeight - CANVAS_CONFIG.padding.section.bottom
        const contentStartY = startY + headerHeight + 30
        const maxWidth = this.cardWidth - CANVAS_CONFIG.padding.section.left - CANVAS_CONFIG.padding.section.right

        // 计算自适应字体大小
        let fontSize = CANVAS_CONFIG.contentFontSize
        let totalHeight = 0
        do {
            this.ctx.font = `${fontSize}px sans-serif`
            totalHeight = 0
            this.params.guidelines?.forEach(guideline => {
                if (!guideline) return
                totalHeight += this.calculateTextHeight(guideline, maxWidth) + 10
            })
            fontSize--
        } while (totalHeight > contentAreaHeight && fontSize > 25)

        // 绘制内容
        this.ctx.font = `${fontSize}px sans-serif`
        this.ctx.globalAlpha = 0.9
        let currentY = contentStartY

        this.params.guidelines?.forEach(guideline => {
            if (!guideline) return
            this.drawWrappedText(
                guideline,
                CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left + 20,
                currentY,
                maxWidth
            )
            currentY += this.calculateTextHeight(guideline, maxWidth) + 10
        })

        this.ctx.restore()
        return startY + sectionHeight
    }

    private drawSentenceSection(startY: number, sectionHeight: number): number {
        this.ctx.save()

        // 标题和图标部分
        const headerHeight = 60
        const iconSize = 20  // 书本图标高度
        const titleY = startY + (headerHeight - CANVAS_CONFIG.subtitleFontSize) / 2
        const iconY = titleY + CANVAS_CONFIG.subtitleFontSize / 2 - iconSize / 2  // 图标中心对齐到文字中心

        // 绘制图标
        this.drawBookIcon(
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left,
            iconY
        )

        // 绘制标题
        this.ctx.font = `bold ${CANVAS_CONFIG.subtitleFontSize}px sans-serif`
        this.ctx.fillStyle = this.fontColor
        this.ctx.fillText(
            '联想句子',
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left + 50,
            titleY + 5
        )

        // 内容区域
        const contentAreaHeight = sectionHeight - headerHeight - CANVAS_CONFIG.padding.section.bottom
        const contentStartY = startY + headerHeight + 30
        const sentenceBoxWidth = this.cardWidth - CANVAS_CONFIG.padding.section.left - CANVAS_CONFIG.padding.section.right

        // 绘制背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        this.ctx.beginPath()
        this.ctx.roundRect(
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left,
            contentStartY,
            sentenceBoxWidth,
            contentAreaHeight,
            10
        )
        this.ctx.fill()

        // 计算自适应字体大小
        let fontSize = CANVAS_CONFIG.contentFontSize
        let contentHeight
        do {
            this.ctx.font = `${fontSize}px sans-serif`
            contentHeight = this.calculateTextHeight(
                this.params.content || '',
                sentenceBoxWidth - CANVAS_CONFIG.padding.section.left
            )
            fontSize--
        } while (contentHeight > contentAreaHeight - 60 && fontSize > 12)

        // 绘制内容
        this.ctx.font = `${fontSize}px sans-serif`
        this.ctx.letterSpacing = '2px'
        this.ctx.fillStyle = this.fontColor
        this.ctx.globalAlpha = 0.9

        // 垂直居中
        const textStartY = contentStartY + (contentAreaHeight - contentHeight) / 2
        this.drawWrappedText(
            this.params.content || '',
            CANVAS_CONFIG.padding.card.left + CANVAS_CONFIG.padding.section.left + 30,
            textStartY,
            sentenceBoxWidth - CANVAS_CONFIG.padding.section.left
        )

        this.ctx.restore()
        return startY + sectionHeight
    }

    private drawSourceSection(startY: number): void {
        this.ctx.font = `${CANVAS_CONFIG.sourceFontSize}px sans-serif`
        this.ctx.globalAlpha = 0.7
        this.ctx.fillStyle = this.fontColor
        const source = this.params.source || ''
        const sourceMetrics = this.ctx.measureText(source)
        this.ctx.fillText(
            source,
            CANVAS_CONFIG.padding.card.left + this.cardWidth - sourceMetrics.width - CANVAS_CONFIG.padding.section.right,
            startY + 30
        )
    }

    private drawConnectIcon(x: number, y: number): void {
        const iconSize = 30
        const centerY = y + iconSize / 2  // 使用图标中心点作为参考

        const connectIcon = new Path2D()
        connectIcon.moveTo(x, centerY)
        connectIcon.arc(x + 15, centerY, 15, 0, Math.PI * 2)
        connectIcon.moveTo(x + 30, centerY)
        connectIcon.lineTo(x + 45, centerY)
        connectIcon.arc(x + 30, centerY, 15, 0, Math.PI * 2)
        this.ctx.strokeStyle = this.fontColor
        this.ctx.lineWidth = 2
        this.ctx.stroke(connectIcon)
    }

    private drawBookIcon(x: number, y: number): void {
        const iconSize = 20
        const bookIcon = new Path2D()
        bookIcon.moveTo(x, y)
        bookIcon.lineTo(x + 30, y)
        bookIcon.lineTo(x + 30, y + iconSize)
        bookIcon.lineTo(x, y + iconSize)
        bookIcon.closePath()
        bookIcon.moveTo(x + 15, y)
        bookIcon.lineTo(x + 15, y + iconSize)
        this.ctx.strokeStyle = this.fontColor
        this.ctx.lineWidth = 2
        this.ctx.stroke(bookIcon)
    }

    private calculateTotalHeight(): number {
        // 计算每个部分实际需要的最小高度
        let titleSectionHeight = CANVAS_CONFIG.titleFontSize + 20 + CANVAS_CONFIG.subtitleFontSize + CANVAS_CONFIG.padding.section.bottom

        let associationHeight = 80 // 标题和图标
        if (this.params.guidelines?.length) {
            const maxWidth = this.cardWidth - CANVAS_CONFIG.padding.section.left - CANVAS_CONFIG.padding.section.right
            this.params.guidelines.forEach(guideline => {
                if (!guideline) return
                associationHeight += this.calculateTextHeight(guideline, maxWidth) + 10
            })
        }
        associationHeight += CANVAS_CONFIG.padding.section.bottom

        let sentenceHeight = 80 // 标题和图标
        const sentenceBoxWidth = this.cardWidth - CANVAS_CONFIG.padding.section.left - CANVAS_CONFIG.padding.section.right
        const contentHeight = this.calculateTextHeight(
            this.params.content || '',
            sentenceBoxWidth - CANVAS_CONFIG.padding.section.left
        )
        sentenceHeight += Math.max(contentHeight + 60, 250) + CANVAS_CONFIG.padding.section.bottom

        let sourceHeight = CANVAS_CONFIG.sourceFontSize + CANVAS_CONFIG.padding.section.bottom

        // 计算理想的总高度（不包括边距）
        const minContentHeight = titleSectionHeight + associationHeight + sentenceHeight + sourceHeight
        const idealHeight = Math.max(minContentHeight, 1000) // 确保最小高度

        // 添加上下边距得到最终高度
        return idealHeight + CANVAS_CONFIG.padding.card.top + CANVAS_CONFIG.padding.card.bottom
    }

    private calculateTextHeight(text: string, maxWidth: number): number {
        const words = text.split('')
        let line = ''
        let height = 0

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i]
            const metrics = this.ctx.measureText(testLine)
            if (metrics.width > maxWidth && i > 0) {
                height += CANVAS_CONFIG.lineHeight
                line = words[i]
            } else {
                line = testLine
            }
        }
        return height + CANVAS_CONFIG.lineHeight
    }

    private drawWrappedText(text: string, x: number, y: number, maxWidth: number): void {
        const words = text.split('')
        let line = ''
        let currentY = y

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i]
            const metrics = this.ctx.measureText(testLine)
            if (metrics.width > maxWidth && i > 0) {
                this.ctx.fillText(line, x, currentY)
                currentY += CANVAS_CONFIG.lineHeight
                line = words[i]
            } else {
                line = testLine
            }
        }
        if (line) {
            this.ctx.fillText(line, x, currentY)
        }
    }
} 