import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from "socket.io";
import { setupSpeechRecognition } from './app/utils/speechRecognition';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    path: '/api/socketio',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket.IO 连接已建立');
    setupSpeechRecognition(socket);

    socket.on('disconnect', () => {
      console.log('Socket.IO 连接已关闭');
    });

    socket.on('error', (error) => {
      console.log('Socket.IO 错误:', error);
    });


  });

  server.listen(3000, (err?: Error) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});