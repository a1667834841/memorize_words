import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Novel } from '../types/novel';
import { ThumbsUp, Meh, ThumbsDown, BookOpen, Badge, Tag, User, Star } from 'lucide-react';

interface NovelIndexPageProps {
  currentNovel: Novel | null;
  votes: { recommend: number; neutral: number; dislike: number };
  handleVote: (type: 'recommend' | 'neutral' | 'dislike') => void;
  startReading: () => void;
}

export const NovelIndexPage: React.FC<NovelIndexPageProps> = ({ currentNovel, votes, handleVote, startReading }) => {
  if (!currentNovel) {
    return <div className="flex justify-center items-center h-screen">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100  w-full">
      <div className="w-full h-full bg-white rounded-lg overflow-hidden shadow-lg">
        <div className="relative h-72 bg-gray-200">
          <img
            src={`${currentNovel.coverImage}`}
            alt="Book Cover"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 ">
          <h1 className="text-2xl font-bold mb-2">{currentNovel.title}</h1>
          <div className="flex items-center mb-4">
            <User className="w-4 h-4 mr-2" />
            <span className="text-sm text-gray-600">主角: {currentNovel.hero}</span>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">故事梗概</h2>
            <p className="text-sm text-gray-600">
              {currentNovel.summary}
            </p>
          </div>
          <div className="flex items-center mb-4">
            <Tag className="w-4 h-4 mr-2" />
            {currentNovel.tags.map((tag, index) => (
              <p className="text-xs bg-gray-100 p-1 ml-1 rounded-full" key={index}>{tag}</p>
            ))}
          </div>
          <div className="flex justify-between mb-4">
            <Button variant="outline" size="sm" className="flex items-center">
              <Star className="w-4 h-4 mr-1" />
              推荐 (99)
            </Button>
            <Button variant="outline" size="sm">一般 (0)</Button>
            <Button variant="outline" size="sm">不行 (0)</Button>
          </div>
          <Button className="w-full mb-4 mt-4 "
            onClick={startReading}
          >
            <BookOpen className="w-4 h-4 mr-2" 
            />
            开始阅读
          </Button>
          <Button variant="secondary" className="w-full"
            onClick={() => window.location.href = '/'}
          >
            退出阅读
          </Button>
        </div>
      </div>
    </div>
  );
};
