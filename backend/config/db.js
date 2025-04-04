const mysql = require('mysql2/promise'); // promise 지원하는 버전 사용

// 환경 변수 로드 (db.js에서도 필요할 수 있음)
require('dotenv').config();

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST, // .env 파일의 DB_HOST 값 사용
  user: process.env.DB_USER, // .env 파일의 DB_USER 값 사용
  password: process.env.DB_PASSWORD, // .env 파일의 DB_PASSWORD 값 사용
  database: process.env.DB_DATABASE, // .env 파일의 DB_DATABASE 값 사용
  waitForConnections: true, // 연결 가능할 때까지 대기
  connectionLimit: 10, // 최대 연결 수 (조정 가능)
  queueLimit: 0 // 연결 대기열 제한 없음
});

// 연결 테스트 함수 (선택적이지만 유용)
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('데이터베이스 연결 성공!');
    connection.release(); // 연결 반환
  } catch (err) {
    console.error('데이터베이스 연결 실패:', err);
    // 여기서 에러 처리 로직 추가 가능 (예: 프로세스 종료)
    // process.exit(1);
  }
}

// 앱 시작 시 연결 테스트 실행
testConnection();

// 다른 파일에서 사용할 수 있도록 풀(pool) 내보내기
module.exports = pool;
