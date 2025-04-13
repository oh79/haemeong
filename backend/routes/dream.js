const express = require('express');
const prisma = require('../lib/prisma'); // 싱글톤 Prisma 인스턴스 사용
const authMiddleware = require('../middleware/authMiddleware'); // 인증 미들웨어 가져오기
const { OpenAI } = require('openai'); // OpenAI 라이브러리 수정 (구조 변경 대응)
const path = require('path');

console.log("--- dreams.js 라우터 파일 로딩됨 ---"); // <--- 이 로그 추가
const router = express.Router();

// OpenAI 클라이언트 초기화 (API 키는 환경 변수에서 자동으로 로드됨)
const openai = new OpenAI(); // API 키를 인자로 전달할 필요 없음 (환경 변수 우선)

// POST /api/dreams - 새 꿈 내용 제출 및 해몽 요청 (인증 필요)
router.post('/', authMiddleware.authenticateToken, async (req, res) => {
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
당신은 한국 문화와 현대 심리학에 능통한 꿈 해몽 전문가입니다.
다음 꿈 내용과 제목을 분석하여 아래 명시된 JSON 형식으로만 응답해주세요.
절대로 JSON 형식 외의 다른 텍스트(예: 설명, 인사말)를 포함하지 마세요.

꿈 제목: "${title}"
꿈 내용:
"${dream_content}"

응답 JSON 구조:
{
  "dreamType": "꿈의 종류 (예: 길몽, 흉몽, 태몽, 심리몽 등 간결한 한 단어)",
  "symbolAnalysis": ["꿈 속 주요 상징(예: 동물, 사물, 행동)과 그 문화적/심리학적 의미를 설명하는 문자열 요소들의 배열"],
  "culturalInterpretation": "한국 문화적 관점에서 꿈 전체에 대한 해석 (길몽/흉몽 여부 포함)",
  "psychologicalInterpretation": "현대 심리학(프로이트, 융 등) 기반의 무의식, 현재 심리 상태 분석",
  "advice": "꿈을 바탕으로 사용자에게 전하는 긍정적인 조언 또는 위로"
}

JSON 응답 예시:
{
  "dreamType": "길몽",
  "symbolAnalysis": [
    "돼지: 한국 문화에서 재물과 행운을 상징합니다. 심리적으로는 풍요와 만족감을 나타냅니다.",
    "집 안으로 들어오는 돼지: 재물이나 좋은 기회가 집안으로 들어오는 것을 의미합니다."
  ],
  "culturalInterpretation": "전통적으로 큰 재물운이 들어올 것을 암시하는 매우 좋은 꿈입니다.",
  "psychologicalInterpretation": "현재 심리적으로 만족스럽고 풍요로운 상태이며, 새로운 기회에 대한 기대감이 무의식에 반영된 것으로 보입니다.",
  "advice": "긍정적인 마음으로 다가오는 좋은 기회를 잡을 준비를 하세요. 자신감을 가져도 좋습니다!"
}
`;
        // ---------------------------------

        // AI 모델 호출 (JSON 응답 형식 지정)
        console.log("--- OpenAI API 요청 시작 ---");
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125", // JSON 모드 지원 모델 확인 (최신 버전 권장)
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            // max_tokens: 1000, // 필요시 토큰 제한 설정
        });
        console.log("--- OpenAI API 응답 수신 ---");

        const interpretationJsonString = completion.choices[0].message.content.trim();
        console.log("Raw JSON String from OpenAI:", interpretationJsonString);

        // --- DB 저장 로직 (Prisma 사용) ---
        const newDream = await prisma.dreams.create({
            data: {
                user_id: userId,
                title: title,
                dream_content: dream_content,
                interpretation: interpretationJsonString, // JSON 문자열 저장
            }
        });
        console.log(`--- Dream ${newDream.id} 저장 완료 ---`);
        // ------------------------------------------

        // --- 응답 전송 (파싱된 JSON 객체 전송) ---
        try {
            const parsedInterpretation = JSON.parse(interpretationJsonString);
            // 생성된 dream 객체 정보와 함께 응답
            res.status(201).json({ 
                dream: { 
                    id: newDream.id, 
                    title: newDream.title, 
                    interpretation: parsedInterpretation // 파싱된 객체
                }
            });
            console.log("--- 클라이언트에 파싱된 JSON 응답 전송 ---");
        } catch (parseError) {
             console.error('Error parsing JSON from OpenAI:', parseError);
             console.error('Invalid JSON string was:', interpretationJsonString);
             res.status(500).json({ message: 'AI 응답 처리 중 오류 발생 (JSON 파싱 실패)' });
        }
        // ------------------------------------

    } catch (error) {
        console.error('Error interpreting dream:', error);
        res.status(500).json({ message: '꿈 해몽 중 오류 발생' });
    }
});

// GET /api/dreams/my - 내 해몽 기록 조회 (인증 필요)
router.get('/my', authMiddleware.authenticateToken, async (req, res) => {
    console.log("--- GET /api/dreams/my 요청 수신 ---"); // 로그 유지
    const userId = req.user.userId;

    console.log(`Fetching dreams for user ID: ${userId}`);

    try {
        // Prisma 사용, interpretation 필드도 가져옴
        const dreams = await prisma.dreams.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
        
        // interpretation 파싱 시도 (결과가 배열이므로 map 사용)
        const formattedDreams = dreams.map(dream => {
            let parsedInterpretation = null;
            try {
                if (dream.interpretation) {
                    parsedInterpretation = JSON.parse(dream.interpretation);
                }
            } catch (parseError) {
                console.warn(`Dream ${dream.id} interpretation parsing failed:`, parseError.message);
            }
            return { ...dream, interpretation: parsedInterpretation }; // 파싱된 결과 또는 null로 교체
        });
        
        console.log(`Found ${dreams.length} dreams for user ${userId}`);
        res.status(200).json(formattedDreams);
    } catch (error) {
        console.error('Error fetching user dreams:', error);
        res.status(500).json({ message: '내 꿈 해몽 기록을 가져오는 중 오류가 발생했습니다.' });
    }
});

// GET /api/dreams/me - 내가 저장한 꿈 목록 조회 (인증 필요)
// --> /my 와 기능이 유사하여 하나로 통합하거나, select 필드를 조정하여 사용
// 여기서는 /my 를 사용하고 이 라우트는 주석 처리 또는 제거 권장
/*
router.get('/me', authMiddleware.authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const dreams = await prisma.dream.findMany({
            where: { user_id: userId },
            select: { id: true, title: true, created_at: true }, // 필요한 필드만 선택
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json(dreams);
    } catch (error) {
        console.error(`사용자 ${userId}의 꿈 목록 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});
*/

// GET /api/dreams/:dreamId - 특정 꿈 상세 조회 (선택적 인증)
router.get('/:dreamId', authMiddleware.optionalAuthenticateToken, async (req, res) => { // 이제 '/my'나 '/me'가 먼저 처리됨
    const dreamId = parseInt(req.params.dreamId, 10);
    if (isNaN(dreamId)) {
        return res.status(400).json({ message: '잘못된 꿈 ID 형식입니다.' });
    }
    // const userId = req.user?.userId; // 상세 조회에서는 현재 불필요

    console.log(`--- GET /api/dreams/:dreamId (${dreamId}) 요청 수신 ---`); // 확인용 로그

    try {
        // Prisma 사용, 사용자 정보도 함께 가져옴
        const dream = await prisma.dreams.findUnique({
            where: { id: dreamId },
            include: { 
                users: { select: { username: true, avatarUrl: true } } // username만 필요하므로 변경 없음
            }
        });

        if (!dream) {
            return res.status(404).json({ message: '꿈 기록을 찾을 수 없습니다.' });
        }

        // interpretation 필드를 JSON으로 파싱
        let parsedInterpretation = null;
        try {
            if (dream.interpretation) {
                parsedInterpretation = JSON.parse(dream.interpretation);
            }
            // 파싱된 interpretation과 사용자 이름 포함 응답
            res.status(200).json({ 
                id: dream.id,
                user_id: dream.user_id,
                username: dream.users.username, // user -> users
                title: dream.title,
                dream_content: dream.dream_content, 
                interpretation: parsedInterpretation, // 파싱된 결과
                created_at: dream.created_at 
            });
        } catch (parseError) {
            console.error(`Error parsing interpretation JSON for dream ${dreamId}:`, parseError);
            console.error('Invalid JSON string in DB was:', dream.interpretation);
            res.status(200).json({ ...dream, interpretation: null, username: dream.users.username }); // user -> users
        }

    } catch (error) {
        console.error(`꿈 ${dreamId} 상세 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
     // finally 에서 connection release 필요 시 추가
});

module.exports = router;
