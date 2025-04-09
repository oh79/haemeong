// backend/server.js

// 환경 변수 로드 (파일 최상단에 위치)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/auth'); // auth 라우트 가져오기 (추가)
const dreamRoutes = require('./routes/dream'); // dream 라우트 가져오기 (추가)
const postRoutes = require('./routes/posts'); // post 라우트 가져오기 (추가)
const userRoutes = require('./routes/users'); // user 라우트 가져오기 (추가)

const app = express();
const PORT = process.env.PORT || 5000; // 환경 변수에서 포트를 가져오거나 기본값 5000 사용

// CORS 미들웨어 설정 (모든 출처 허용 - 개발 단계)
// 실제 배포 시에는 프론트엔드 주소만 허용하도록 설정 변경 필요
app.use(cors());

// 요청 본문을 JSON으로 파싱하기 위한 미들웨어
app.use(express.json());

// 간단한 테스트 라우트
app.get('/', async (req, res) => {
  res.send('꿈 해몽 서비스 백엔드 서버');
  try {
    // DB 연결 확인을 위해 한 번 연결을 시도
    const [rows, fields] = await db.query('SELECT NOW()');
    res.json({ message: 'DB connected successfully', time: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to connect to DB', details: err.message });
  }
});

// 인증 관련 라우트 연결 (추가)
// '/api/auth' 경로로 들어오는 요청은 ./routes/auth.js 파일에서 처리
app.use('/api/auth', authRoutes);

// 꿈 관련 라우트 (추가)
app.use('/api/dreams', dreamRoutes);

// 게시글 관련 라우트 (추가)
app.use('/api/posts', postRoutes);

// 사용자 관련 라우트 (추가)
app.use('/api/users', userRoutes);

// 서버 시작
app.listen(PORT, '0.0.0.0', () =>  {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});

