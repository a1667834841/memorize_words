import { audioToWav } from '@/app/utils/audio';
import { useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export const useWebSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    // useEffect(() => {
    //     const socketIo = io({
    //         path: '/api/socketio'
    //     });
    //     setSocket(socketIo);

    //     socketIo.on('connect', () => setIsConnected(true));
    //     socketIo.on('disconnect', () => setIsConnected(false));
    //     socketIo.on('message', (data) => {
    //         console.log("客户端接收 message:", data)
    //         setLastMessage(data)
    //     });

    //     return () => {
    //         socketIo.disconnect();
    //     };
    // }, []);

    // const sendMessage = useCallback(async (message: string | Blob | ArrayBuffer) => {
    //     if (socket && isConnected) {
    //         console.log("客户端发送 message type:", typeof message);
    //         console.log("客户端发送 message 内容:", message);
    //         if (typeof message === 'object' && message !== null) {
    //             console.log("message 是对象，其属性包括:", Object.keys(message));
    //         }
    //         const wavBlob = await audioToWav(message);
    //         socket.emit('message', wavBlob);
    //     }
    // }, [socket, isConnected]);



    return { lastMessage, isConnected };
};


export const getSpeechToken = async () => {
    try {
        const response = await fetch('/api/speech-token');
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

