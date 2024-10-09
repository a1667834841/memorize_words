async function convertToAudioBuffer(blob: Blob): Promise<ArrayBuffer> {
    return await blob.arrayBuffer();
}

async function audioToWav(input: Blob | ArrayBuffer | Object, sampleRate: number = 0): Promise<Blob> {
    let buffer: ArrayBuffer;
    debugger

    if (input instanceof Blob) {
        buffer = await convertToAudioBuffer(input);

    } else if (input instanceof ArrayBuffer) {
        buffer = input;
    } else if (input instanceof Object) {
        // 1. 将对象转换为 JSON 字符串
        const jsonString = JSON.stringify(input);

        // 2. 创建一个 Uint8Array，将字符串转换为 UTF-8 编码的字节
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(jsonString);

        // 3. 返回对应的 ArrayBuffer
        buffer = uint8Array.buffer;
    } else {
        buffer = input;
    }

    return convertWebMToWAV(buffer, sampleRate);
}

// 转换 WebM 到 WAV 格式
async function convertWebMToWAV(arrayBuffer: ArrayBuffer, sampleRate: number = 0) {
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    // 获取PCM数据
    const pcmData = audioBuffer.getChannelData(0);
    const wavBuffer = encodeWAV(pcmData, sampleRate === 0 ? audioBuffer.sampleRate : sampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
}

// 将PCM数据编码为WAV
function encodeWAV(samples: Float32Array, sampleRate: number) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function write16Bit(view: DataView, offset: number, value: number) {
        view.setInt16(offset, value, true);
    }

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);  // PCM format
    view.setUint16(22, 1, true);  // Number of channels (mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);  // Byte rate
    view.setUint16(32, 2, true);  // Block align
    view.setUint16(34, 16, true); // Bits per sample

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write the PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        write16Bit(view, offset, samples[i] * 0x7FFF);
        offset += 2;
    }

    return buffer;
}

class AudioPlayer {
    private audioContext: AudioContext;
  
    constructor() {
      this.audioContext = new (window.AudioContext);
    }
  
    async playArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
      try {
        // 将 ArrayBuffer 解码为 AudioBuffer
        const audioBuffer = await this.decodeAudioData(arrayBuffer);
        
        // 播放解码后的 AudioBuffer
        this.playAudioBuffer(audioBuffer);
      } catch (error) {
        console.error('播放音频时出错:', error);
      }
    }
  
    private decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
      return new Promise((resolve, reject) => {
        this.audioContext.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (error) => reject(error)
        );
      });
    }
  
    private playAudioBuffer(audioBuffer: AudioBuffer): void {
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  
    // 可选：如果需要停止所有音频播放
    stopAll(): void {
      this.audioContext.close().then(() => {
        this.audioContext = new (window.AudioContext);
      });
    }
  }
  



class MicrophoneSoundDetector {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private stream: MediaStream | null = null;
    private onSoundDetected: () => void;
    private animationFrameId: number | null = null;  // 新增：用于存储 requestAnimationFrame 的 ID
    private stopRequested: boolean = false;  // 新增：用于标记停止请求

    constructor(onSoundDetected: () => void) {
        this.onSoundDetected = onSoundDetected;
    }

    public async start(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.audioContext = new (window.AudioContext);
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.microphone.connect(this.analyser);

            this.detectSound();
        } catch (err) {
            console.error('无法访问麦克风', err);
            this.stop();
        }
    }

    public stop(): void {
        console.log("停止声音检测");
        
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.cleanupResources();
    }

    private cleanupResources(): void {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }

        if (this.analyser) {
            this.analyser.disconnect();
            this.analyser = null;
        }

        if (this.audioContext) {
            this.audioContext.close().then(() => {
                console.log("音频上下文已关闭");
            }).catch(err => {
                console.error("关闭音频上下文时出错:", err);
            });
            this.audioContext = null;
        }

        this.dataArray = null;

        console.log("声音检测已停止并清理资源");
    }

    private detectSound = (): void => {
        if (!this.analyser || !this.dataArray) {
            return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        if (average > 20) {
            console.log('检测到声音');
            this.stop();  // 立即停止检测
            this.onSoundDetected();  // 执行回调函数
            return;  // 不再继续检测
        }

        this.animationFrameId = requestAnimationFrame(this.detectSound);
    };
}
  
  
  

export {
    audioToWav,
    MicrophoneSoundDetector,
    AudioPlayer
}