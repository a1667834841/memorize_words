import { DailyVocabularyComponent } from '@/components/daily-vocabulary'
import Home from '../page' 



export default function DailyVocabularyPage() {

  const BackButton = () => {
    
    return (
      <button className="absolute top-4 left-4 p-2 bg-gray-200 hover:bg-gray-300 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
    );
  };

  return (
    <div className="relative">
      <BackButton />
      <DailyVocabularyComponent />
    </div>
  )
}