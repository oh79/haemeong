const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware'); // 인증 미들웨어 가져오기
const { OpenAI } = require('openai'); // OpenAI 라이브러리 수정 (구조 변경 대응)

console.log("--- dreams.js 라우터 파일 로딩됨 ---"); // <--- 이 로그 추가
const router = express.Router();

// OpenAI 클라이언트 초기화 (API 키는 환경 변수에서 자동으로 로드됨)
const openai = new OpenAI(); // API 키를 인자로 전달할 필요 없음 (환경 변수 우선)

// POST /api/dreams - 새 꿈 내용 제출 및 해몽 요청 (인증 필요)
router.post('/', authenticateToken, async (req, res) => {
    const { title, dream_content } = req.body;
    const userId = req.user.userId;

    // --- userId 변수가 제대로 할당되었는지 확인 (디버깅용) ---
    console.log("Extracted User ID:", userId);
    if (!userId) {
        console.error("Error: User ID is missing after authentication.");
        return res.status(500).json({ message: '인증 처리 중 사용자 ID를 가져오지 못했습니다.' });
    }
    // ----------------------------------------------------

    if (!title || !dream_content) {
        return res.status(400).json({ message: '제목과 꿈 내용을 모두 입력해야 합니다.' });
    }

    try {
        // --- 여기가 수정될 프롬프트 부분 ---
        const prompt = `
다음 꿈 내용을 분석하고, 각 문장별로 한국 문화적 맥락과 현대 심리학적 관점을 포함하여 상세하게 해몽해주세요. 마지막에는 꿈 전체에 대한 종합적인 해몽 요약을 제공해주세요. 각 문장별 해몽은 "**문장 N:** [사용자 문장] **해석:** [해몽 내용]" 형식으로 작성하고, 종합 해몽은 "---" 구분자 다음에 "### 종합 해몽" 제목과 함께 작성해주세요.

꿈 제목: ${title}
꿈 내용:
${dream_content}

---
### 문장별 해몽
**문장 1:** [첫 번째 문장] **해석:** [한국 문화적 해석 + 심리학적 해석]
**문장 2:** [두 번째 문장] **해석:** [한국 문화적 해석 + 심리학적 해석]
... (나머지 문장)

---
### 종합 해몽
[꿈 전체에 대한 종합적인 해몽 요약 (문화적/심리학적 관점 포함)]
`;
        // ---------------------------------

        // AI 모델 호출 (예시: OpenAI 사용 시)
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // 또는 사용하는 모델
            messages: [{ role: "user", content: prompt }],
            // max_tokens: 1000, // 필요시 토큰 제한 설정
        });

        const interpretation = completion.choices[0].message.content.trim();

        // DB 저장 로직
        const [result] = await pool.query(
            'INSERT INTO dreams (user_id, title, dream_content, interpretation) VALUES (?, ?, ?, ?)',
            [userId, title, dream_content, interpretation]
        );
        const insertId = result.insertId;

        res.status(201).json({ dream: { id: insertId, title, interpretation } });

    } catch (error) {
        console.error('Error interpreting dream:', error);
        res.status(500).json({ message: '꿈 해몽 중 오류 발생' });
    }
});

// GET /api/dreams/my - 내 해몽 기록 조회 (인증 필요)
router.get('/my', authenticateToken, async (req, res) => {
    console.log("--- GET /api/dreams/my 요청 수신 ---"); // 로그 유지
    const userId = req.user.userId;

    console.log(`Fetching dreams for user ID: ${userId}`);

    try {
        const [dreams] = await pool.query(
            `SELECT id, title, interpretation, created_at 
             FROM dreams 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        console.log(`Found ${dreams.length} dreams for user ${userId}`);
        res.status(200).json(dreams);
    } catch (error) {
        console.error('Error fetching user dreams:', error);
        res.status(500).json({ message: '내 꿈 해몽 기록을 가져오는 중 오류가 발생했습니다.' });
    }
});

// GET /api/dreams/me - 내가 저장한 꿈 목록 조회 (인증 필요)
router.get('/me', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        // 필요한 정보만 선택 (content, interpretation은 제외하고 목록 구성)
        const [dreams] = await pool.query(
            `SELECT id, user_id, title, created_at
             FROM dreams
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );
        res.status(200).json(dreams);
    } catch (error) {
        console.error(`사용자 ${userId}의 꿈 목록 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
    // finally 에서 connection release 필요 시 추가
});

// GET /api/dreams/:dreamId - 특정 꿈 상세 조회 (인증 옵션)
router.get('/:dreamId', authenticateToken, async (req, res) => { // 이제 '/my'가 먼저 처리됨
    const dreamId = req.params.dreamId;
    const userId = req.user?.userId;

    console.log(`--- GET /api/dreams/:dreamId (${dreamId}) 요청 수신 ---`); // 확인용 로그

    try {
        // 모든 정보 조회 (title 포함)
        const [dreamResult] = await pool.query(
            `SELECT d.id, d.user_id, d.title, d.dream_content, d.interpretation, d.created_at, u.username
             FROM dreams d
             JOIN users u ON d.user_id = u.id
             WHERE d.id = ?`,
            [dreamId]
        );

        if (dreamResult.length === 0) {
            return res.status(404).json({ message: '꿈 기록을 찾을 수 없습니다.' });
        }
        const dream = dreamResult[0];

        // --- (추가 기능) 작성자 본인 확인 ---
        // const isOwner = userId && dream.user_id === userId;
        // res.status(200).json({ ...dream, isOwner });
        // ----------------------------------

        res.status(200).json(dream); // 일단 모든 정보 반환

    } catch (error) {
        console.error(`꿈 ${dreamId} 상세 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
     // finally 에서 connection release 필요 시 추가
});

module.exports = router;
