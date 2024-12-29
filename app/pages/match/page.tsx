"use client"

import { useWordMatchGame } from './hooks/useWordMatchGame'
import { GameBoard } from './components/GameBoard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Confetti from 'react-confetti'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/components/NavBar'

export default function WordMatchingGamePage() {
  const { gameState, actions } = useWordMatchGame()
  const router = useRouter()

  const goBack = () => {
    router.push('/')
  }

  return (
    <div className="container mx-auto p-4">
      {gameState.showConfetti && <Confetti />}
      <NavBar title='单词消消乐' />

      {/* 游戏状态显示 */}
      <div className="flex justify-between mb-4" style={{ marginTop: '4rem' }}>
        <div className="text-xl">得分: {gameState.score}</div>
        <div className="text-xl">
          时间: <span className={`${gameState.timeLeft < 10 ? 'text-red-500' : ''} w-16 inline-block text-center`}>
            {gameState.timeLeft}
          </span>s
        </div>
      </div>

      {/* 根据游戏状态显示不同内容 */}
      {!gameState.gameStarted ? (
        // 游戏开始前的说明
        <div className="text-center my-3">
          <p className="text-gray-500 text-left my-5 text-md ">
            游戏说明：点击"开始游戏"后，你将有60秒的时间来匹配英文单词和中文释义。选择一个英文单词和一个中文释义，如果匹配正确，它们将消失并得分。尽可能在时间内匹配更多单词！祝你好运吧！
          </p>
          <Button disabled={gameState.gameWords.length == 0} onClick={actions.startGame}>开始游戏</Button>
        </div>
      ) : gameState.gameOver ? (
        // 游戏结束界面
        <div className="text-center">
          <h2 className="text-2xl mb-4">游戏结束！</h2>
          <p className="text-xl mb-4">你的得分是: {gameState.score}</p>
          {gameState.showConfetti && <p className="text-xl mb-4">恭喜你提前完成所有单词匹配！</p>}
          <div className="flex justify-center space-x-4">
            <Button onClick={actions.restartGame}>重新开始</Button>
            <Button asChild>
              <Link href="/" onClick={(e) => {
                e.preventDefault();
                goBack()
              }}>
                返回首页
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <GameBoard
          displayWords={gameState.displayWords}
          selectedEnglish={gameState.selectedEnglish}
          selectedChinese={gameState.selectedChinese}
          matchedPair={gameState.matchedPair}
          mismatchedPair={gameState.mismatchedPair}
          fadingOutWords={gameState.fadingOutWords}
          hiddenWords={gameState.hiddenWords}
          onSelect={actions.handleSelect}
          onHideWord={actions.hideWord}
        />
      )}
    </div>
  )
}