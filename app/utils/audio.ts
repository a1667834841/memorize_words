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


function saveAudioToFile(blob: Blob) {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = 'audio.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export {
    audioToWav,
    saveAudioToFile
}