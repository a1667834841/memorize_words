

export const getSpeechToken = async () => {
    try {
        const response = await fetch('/api/speech-token', {
            next: {
              revalidate: 600, // 10 min
            },
            cache: 'no-store'
          });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error('获取语音令牌失败');
            return null;
        }
    } catch (error) {
        console.error('获取语音令牌时出错:', error);
        return null;
    }
};

