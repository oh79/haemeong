// backend/server.js

// 환경 변수 로드 (파일 최상단에 위치)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path'); // path 모듈 추가
// const pool = require('./config/db'); // !!! Prisma 사용으로 제거 !!!
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

// 정적 파일 제공 설정 (uploads 폴더)
// /uploads URL 경로로 요청이 오면 backend/uploads 디렉토리에서 파일을 찾음
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 간단한 테스트 라우트 (DB 연결 확인 코드 제거)
app.get('/', async (req, res) => {
  res.send('꿈 해몽 서비스 백엔드 서버');
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

