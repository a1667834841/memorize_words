import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Socket } from 'socket.io';

export const setupSpeechRecognition = (socket: Socket) => {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
        socket.emit('error', { message: 'Azure Speech配置缺失' });
        return;
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechRecognitionLanguage = 'zh-CN';

    const audioConfig = sdk.AudioConfig.fromStreamInput(sdk.AudioInputStream.createPushStream());
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    const pushStream = sdk.AudioInputStream.createPushStream();

    recognizer.recognizing = (s, e) => {
        console.log("recognizing e:", e)
        if (e.result.reason === sdk.ResultReason.RecognizingSpeech) {
            socket.emit('message', { text: e.result.text, isFinal: false });
        }
        if (e.result.reason === sdk.ResultReason.NoMatch) {
            socket.emit('message', { text: e.result.text, isFinal: false });
        }
        if (e.result.reason === sdk.ResultReason.Canceled) {
            socket.emit('message', { text: e.result.text, isFinal: false });
        }
        if (e.result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            socket.emit('message', 'END_OF_STREAM');
        }
    };

    recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            socket.emit('message', { text: e.result.text, isFinal: true });
        }
    };

    socket.on('message', (message: string | ArrayBuffer | Blob | Object) => {
        console.log("服务端接收 message.type:", typeof message)
        if (message === 'END_OF_STREAM') {
            recognizer.stopContinuousRecognitionAsync();
        } else if (message instanceof ArrayBuffer) {
            console.log("服务端接受 ArrayBuffer message:", message)
            const pushStream = sdk.AudioInputStream.createPushStream();
            pushStream.write(message);
        } else if (typeof message === 'string') {
            console.log("服务端接受string message:", message)
        } else if (message instanceof Blob) {
            console.log("服务端接受blob message:", message);
            message.arrayBuffer().then(buffer => {
                pushStream.write(buffer);
            });
        } else if (typeof message === 'object') {
            console.log("服务端接受object message:", message);
            // message 强转 ArrayBuffer
            const buffer = message as ArrayBuffer;
            pushStream.write(buffer);
        } else {
            console.log("服务端接受未知类型,type:", typeof message, " message:", message);
        }
    });

    socket.on('disconnect', () => {
        recognizer.stopContinuousRecognitionAsync();
    });

    recognizer.startContinuousRecognitionAsync();
};