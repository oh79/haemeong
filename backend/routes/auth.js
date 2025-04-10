const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db'); // DB 연결 풀 가져오기
const jwt = require('jsonwebtoken'); // jsonwebtoken 임포트 추가

const router = express.Router();
const saltRounds = 10; // bcrypt 해싱 강도 (숫자가 클수록 안전하지만 느림)

// POST /api/auth/signup - 회원가입 요청 처리
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // 1. 입력값 검증 (기본)
  if (!username || !email || !password) {
    return res.status(400).json({ message: '사용자 이름, 이메일, 비밀번호는 필수입니다.' });
  }

  // 2. 비밀번호 길이 검증 (예시)
  if (password.length < 6) {
    return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' });
  }

  let connection; // try-catch-finally에서 connection을 참조하기 위해 밖에 선언

  try {
    connection = await pool.getConnection(); // 풀에서 연결 가져오기

    // 3. 사용자 이름 또는 이메일 중복 확인
    const [existingUsers] = await connection.query(
      'SELECT username, email FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      let message = '';
      if (existingUsers[0].username === username) {
        message = '이미 사용 중인 사용자 이름입니다.';
      } else {
        message = '이미 사용 중인 이메일입니다.';
      }
      return res.status(409).json({ message }); // 409 Conflict: 충돌 상태
    }

    // 4. 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. 새 사용자 정보 DB에 저장
    const [result] = await connection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    console.log('회원가입 성공:', { id: result.insertId, username, email }); // 서버 로그

    // 6. 성공 응답 전송
    res.status(201).json({ message: '회원가입이 성공적으로 완료되었습니다.' }); // 201 Created: 리소스 생성됨

  } catch (error) {
    console.error('회원가입 처리 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.' }); // 500 Internal Server Error
  } finally {
    if (connection) {
      connection.release(); // 사용한 연결은 반드시 풀에 반환!
    }
  }
});

// POST /api/auth/login - 로그인 요청 처리
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. 입력값 검증
  if (!username || !password) {
    return res.status(400).json({ message: '사용자 이름과 비밀번호를 모두 입력해주세요.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 2. 사용자 이름으로 사용자 찾기
    const [users] = await connection.query(
      'SELECT id, username, email, password FROM users WHERE username = ?',
      [username]
    );

    // 3. 사용자가 존재하지 않는 경우
    if (users.length === 0) {
      return res.status(401).json({ message: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' }); // Unauthorized
    }

    const user = users[0];

    // 4. 입력된 비밀번호와 DB의 해시된 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);

    // 5. 비밀번호가 일치하지 않는 경우
    if (!isMatch) {
      return res.status(401).json({ message: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' }); // Unauthorized
    }

    // 6. 비밀번호 일치 -> JWT 생성
    const payload = { // 토큰에 담을 정보 (민감 정보 제외!)
      userId: user.id,
      username: user.username,
    };
    const secretKey = process.env.JWT_SECRET; // .env 파일에서 비밀키 가져오기
    const options = { expiresIn: '1h' }; // 토큰 유효 시간 (예: 1시간)

    const token = jwt.sign(payload, secretKey, options);

    console.log('로그인 성공:', { username: user.username });

    // 7. 생성된 토큰과 함께 성공 응답 전송
    res.status(200).json({
      message: '로그인 성공!',
      token: token, // 클라이언트에게 토큰 전달
      user: { // 사용자 정보도 함께 전달 (선택적)
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('로그인 처리 중 오류 발생:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다. 나중에 다시 시도해주세요.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 로그인 등 다른 인증 라우트도 여기에 추가 예정...

module.exports = router; // 라우터 객체 내보내기
