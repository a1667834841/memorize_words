import GradientConfigurableCard from './components/GradientConfigurableCard';

export default function ColorCard() {
  return (
    <main>
      <GradientConfigurableCard 
        initialTitle="炫彩世界"
        initialSubtitle="探索无限可能"
        initialContent="梦想与现实交织，创造无限精彩。让我们一起开启这段奇妙的旅程，发现生活中的每一个惊喜。在这个充满活力的空间里，我们可以尽情发挥创意，实现自我。"
        initialSource="— 创意工坊"
        initialBgColor1="#4A00E0"
        initialBgColor2="#8E2DE2"
        initialCardColor1="#FFFFFF"
        initialCardColor2="#F0F0F0"
      />
    </main>
  );
}

