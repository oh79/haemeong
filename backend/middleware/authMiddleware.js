const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // 1. 요청 헤더에서 'Authorization' 값 가져오기
  const authHeader = req.headers['authorization'];
  // 'Bearer TOKEN_STRING' 형태이므로, 존재하면 'Bearer ' 다음 부분을 토큰으로 간주
  const token = authHeader && authHeader.split(' ')[1];

  // 2. 토큰이 없는 경우
  if (token == null) {
    // 401 Unauthorized: 인증되지 않음
    return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
  }

  // 3. 토큰 검증
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // 3.1. 토큰이 유효하지 않은 경우 (만료되었거나, 잘못된 토큰)
    if (err) {
      console.error('JWT 검증 오류:', err.message);
      // 403 Forbidden: 권한 없음 (유효하지 않은 토큰)
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }

    // 3.2. 토큰이 유효한 경우, 요청 객체(req)에 사용자 정보(payload) 추가
    // 이렇게 하면 다음 미들웨어나 라우트 핸들러에서 req.user 로 접근 가능
    req.user = user;
    next(); // 다음 미들웨어 또는 라우트 핸들러로 진행
  });
};

// optionalAuthenticateToken 함수 추가
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        // 토큰이 없으면 사용자 정보 없이 다음으로 진행
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) {
            // 토큰이 유효하면 사용자 정보(페이로드)를 req.user에 추가
            req.user = user;
        }
        // 토큰이 유효하지 않더라도 에러를 반환하지 않고 다음으로 진행
        if (err) {
             console.warn('Optional Auth: 유효하지 않은 토큰 감지 - ', err.message);
        }
        next();
    });
}

// 두 함수를 함께 export 하도록 수정
// module.exports = authenticateToken; // 기존 라인 주석 처리 또는 삭제
module.exports = { authenticateToken, optionalAuthenticateToken };
