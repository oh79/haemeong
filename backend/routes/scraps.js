// backend/routes/scraps.js
const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/scraps/me - 내가 스크랩한 글 목록 조회 (인증 필요)
router.get('/me', authMiddleware.authenticateToken, async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: '스크랩 목록을 보려면 로그인이 필요합니다.' });
    }

    try {
        const scrappedPosts = await prisma.scraps.findMany({
            where: { user_id: userId },
            select: {
                created_at: true, // 스크랩한 시간
                posts: { // 연결된 게시글 정보 선택
                    select: {
                        id: true,
                        title: true,
                        created_at: true, // 게시글 생성 시간
                        users: { select: { username: true } }, // 게시글 작성자
                        images: { // 첫 이미지 URL 가져오기
                            orderBy: { created_at: 'asc' },
                            take: 1,
                            select: { url: true }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' } // 스크랩한 시간 순 정렬
        });

        // 데이터 형식 가공 (프론트엔드에서 사용하기 쉽게)
        const responseData = scrappedPosts.map(scrap => {
            // 혹시 posts 정보가 없는 비정상적인 scrap 데이터는 제외
            if (!scrap.posts) return null;
            return {
                scrappedAt: scrap.created_at,
                id: scrap.posts.id, // 게시글 id
                title: scrap.posts.title,
                createdAt: scrap.posts.created_at, // 게시글 생성 시간
                username: scrap.posts.users?.username || '익명',
                // 첫 번째 이미지 URL 추가 (없으면 null)
                imageUrl: Array.isArray(scrap.posts.images) && scrap.posts.images.length > 0 ? scrap.posts.images[0]?.url : null,
            };
        }).filter(item => item !== null); // null 제거

        res.status(200).json(responseData);
    } catch (error) {
        console.error(`사용자 ${userId}의 스크랩 목록 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router; 