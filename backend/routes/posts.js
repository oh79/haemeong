// backend/routes/posts.js

const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware'); // 인증 미들웨어

const router = express.Router();

// GET /api/posts - 게시글 목록 조회 (REQ06_NOTICE_BOARD_01)
router.get('/', async (req, res) => {
    const searchQuery = req.query.search || '';
    const searchPattern = `%${searchQuery}%`;

    try {
        // 좋아요 수를 함께 가져오기 위해 LEFT JOIN 및 COUNT 사용
        const [posts] = await pool.query(
            `SELECT
                p.id, p.title, p.created_at, u.username,
                COUNT(l.id) as likeCount  -- 좋아요 수 계산
             FROM posts p
             JOIN users u ON p.user_id = u.id
             LEFT JOIN likes l ON p.id = l.post_id -- 좋아요 테이블과 LEFT JOIN
             WHERE p.title LIKE ? OR p.content LIKE ?
             GROUP BY p.id -- 게시글 ID 별로 그룹화하여 좋아요 수 집계
             ORDER BY p.created_at DESC
             LIMIT 50`,
            [searchPattern, searchPattern]
        );
        res.status(200).json(posts);
    } catch (error) {
        console.error('게시글 목록 조회 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// POST /api/posts - 새 게시글 작성 (REQ06_NOTICE_BOARD_02, 인증 필요)
router.post('/', authenticateToken, async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.userId; // 인증된 사용자의 ID

    // 1. 입력값 검증
    if (!title || !content || title.trim() === '' || content.trim() === '') {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        // 2. 새 게시글 정보 DB에 저장
        const [result] = await connection.query(
            'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)',
            [userId, title, content]
        );
        const newPostId = result.insertId;

        // 3. 방금 생성된 게시글 정보 반환 (선택적)
        const [newPost] = await connection.query(
            `SELECT p.id, p.title, p.content, p.created_at, u.username
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [newPostId]
        );

        console.log('새 게시글 작성 성공:', { id: newPostId, title, userId });
        res.status(201).json(newPost[0]); // 생성된 게시글 정보 반환

    } catch (error) {
        console.error('게시글 작성 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// GET /api/posts/:postId - 특정 게시글 상세 조회 (스크랩 여부 포함)
router.get('/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user?.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 게시글 정보 조회 (작성자 이름 포함)
        const [postResult] = await connection.query(
            `SELECT p.id, p.title, p.content, p.created_at, p.updated_at, p.user_id, u.username
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [postId]
        );

        if (postResult.length === 0) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
        const post = postResult[0];

        // 2. 해당 게시글의 댓글 목록 조회 (작성자 이름 포함)
        const [commentsResult] = await connection.query(
            `SELECT c.id, c.content, c.created_at, c.user_id, u.username
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`, // 오래된 댓글부터 정렬
            [postId]
        );
        const comments = commentsResult;

        // 3. 좋아요 수 조회
        const [likeCountResult] = await connection.query(
            'SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?',
            [postId]
        );
        const likeCount = likeCountResult[0].likeCount;

        // 4. 현재 로그인 사용자의 좋아요 여부 확인 (로그인 상태일 때만)
        let likedByUser = false;
        if (userId) {
            const [userLikeResult] = await connection.query(
                'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );
            likedByUser = userLikeResult.length > 0;
        }

        // 5. 현재 로그인 사용자의 스크랩 여부 확인 (추가)
        let scrappedByUser = false;
        if (userId) {
            const [userScrapResult] = await connection.query(
                'SELECT id FROM scraps WHERE user_id = ? AND post_id = ?',
                [userId, postId]
            );
            scrappedByUser = userScrapResult.length > 0;
        }

        // 6. 게시글 정보와 댓글 목록 함께 반환
        res.status(200).json({
             ...post,          // 게시글 기본 정보
             comments,         // 댓글 목록
             likeCount,        // 좋아요 수
             likedByUser,      // 현재 사용자의 좋아요 여부
             scrappedByUser    // 스크랩 여부 추가
        });

    } catch (error) {
        console.error(`게시글 ${postId} 상세 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// POST /api/posts/:postId/comments - 새 댓글 작성 (REQ06_NOTICE_BOARD_06, 인증 필요)
router.post('/:postId/comments', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const { content } = req.body;
    const userId = req.user.userId; // 인증된 사용자의 ID

    // 1. 입력값 검증
    if (!content || content.trim() === '') {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 2. 원본 게시글 존재 여부 확인 (선택적이지만 안전함)
        const [postExists] = await connection.query('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ message: '댓글을 작성할 게시글을 찾을 수 없습니다.' });
        }

        // 3. 새 댓글 정보 DB에 저장
        const [result] = await connection.query(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );
        const newCommentId = result.insertId;

        // 4. 방금 생성된 댓글 정보 반환 (작성자 이름 포함)
        const [newComment] = await connection.query(
            `SELECT c.id, c.content, c.created_at, c.user_id, u.username
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
             [newCommentId]
        );

        console.log(`게시글 ${postId}에 새 댓글 작성 성공:`, { id: newCommentId, userId });
        res.status(201).json(newComment[0]); // 생성된 댓글 정보 반환

    } catch (error) {
        console.error(`게시글 ${postId} 댓글 작성 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// PUT /api/posts/:postId - 게시글 수정 (REQ06_NOTICE_BOARD_04, 인증 및 작성자 확인 필요)
router.put('/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const { title, content } = req.body;
    const userId = req.user.userId; // 인증된 사용자 ID

    // 1. 입력값 검증
    if (!title || !content || title.trim() === '' || content.trim() === '') {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 2. 게시글 존재 여부 및 작성자 확인
        const [posts] = await connection.query(
            'SELECT user_id FROM posts WHERE id = ?',
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({ message: '수정할 게시글을 찾을 수 없습니다.' });
        }
        if (posts[0].user_id !== userId) {
            // 본인 글이 아니면 수정 불가 (Forbidden)
            return res.status(403).json({ message: '게시글을 수정할 권한이 없습니다.' });
        }

        // 3. 게시글 정보 업데이트
        await connection.query(
            'UPDATE posts SET title = ?, content = ? WHERE id = ?',
            [title, content, postId]
        );

        // 4. 수정된 게시글 정보 반환 (선택적)
        const [updatedPost] = await connection.query(
           `SELECT p.id, p.title, p.content, p.created_at, p.updated_at, u.username
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?`,
           [postId]
        );

        console.log(`게시글 ${postId} 수정 성공:`, { userId });
        res.status(200).json(updatedPost[0]); // 수정된 게시글 정보 반환

    } catch (error) {
        console.error(`게시글 ${postId} 수정 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// DELETE /api/posts/:postId - 게시글 삭제 (REQ06_NOTICE_BOARD_05, 인증 및 작성자 확인 필요)
router.delete('/:postId', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 게시글 존재 여부 및 작성자 확인
        const [posts] = await connection.query(
            'SELECT user_id FROM posts WHERE id = ?',
            [postId]
        );

        if (posts.length === 0) {
            // 이미 삭제되었거나 없는 경우에도 성공처럼 처리할 수 있음 (멱등성)
            return res.status(404).json({ message: '삭제할 게시글을 찾을 수 없습니다.' });
        }
        if (posts[0].user_id !== userId) {
            return res.status(403).json({ message: '게시글을 삭제할 권한이 없습니다.' });
        }

        // 2. 게시글 삭제 (ON DELETE CASCADE 설정으로 댓글도 자동 삭제됨)
        await connection.query('DELETE FROM posts WHERE id = ?', [postId]);

        console.log(`게시글 ${postId} 삭제 성공:`, { userId });
        res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });
        // 또는 res.status(204).send(); // No Content 응답도 가능

    } catch (error) {
        console.error(`게시글 ${postId} 삭제 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// PUT /api/posts/:postId/comments/:commentId - 댓글 수정 (REQ06_NOTICE_BOARD_07, 인증 및 작성자 확인 필요)
router.put('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    const { postId, commentId } = req.params; // 게시글 ID, 댓글 ID 가져오기
    const { content } = req.body;           // 수정할 내용 가져오기
    const userId = req.user.userId;         // 인증된 사용자 ID

    // 1. 입력값 검증
    if (!content || content.trim() === '') {
        return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 2. 댓글 존재 여부 및 작성자 확인
        const [comments] = await connection.query(
            'SELECT user_id FROM comments WHERE id = ? AND post_id = ?',
            [commentId, postId] // 댓글 ID와 게시글 ID가 모두 일치하는지 확인
        );

        if (comments.length === 0) {
            return res.status(404).json({ message: '수정할 댓글을 찾을 수 없습니다.' });
        }
        if (comments[0].user_id !== userId) {
            return res.status(403).json({ message: '댓글을 수정할 권한이 없습니다.' });
        }

        // 3. 댓글 내용 업데이트
        await connection.query(
            'UPDATE comments SET content = ? WHERE id = ?',
            [content, commentId]
        );

        // 4. 수정된 댓글 정보 반환 (선택적)
        const [updatedComment] = await connection.query(
           `SELECT c.id, c.content, c.created_at, c.user_id, u.username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?`,
           [commentId]
        );

        console.log(`댓글 ${commentId} (게시글 ${postId}) 수정 성공:`, { userId });
        res.status(200).json(updatedComment[0]); // 수정된 댓글 정보 반환

    } catch (error) {
        console.error(`댓글 ${commentId} 수정 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// DELETE /api/posts/:postId/comments/:commentId - 댓글 삭제 (REQ06_NOTICE_BOARD_08, 인증 및 작성자 확인 필요)
router.delete('/:postId/comments/:commentId', authenticateToken, async (req, res) => {
    const { postId, commentId } = req.params;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. 댓글 존재 여부 및 작성자 확인
        const [comments] = await connection.query(
            'SELECT user_id FROM comments WHERE id = ? AND post_id = ?',
            [commentId, postId]
        );

        if (comments.length === 0) {
            return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다.' });
        }
        if (comments[0].user_id !== userId) {
            return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
        }

        // 2. 댓글 삭제
        await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);

        console.log(`댓글 ${commentId} (게시글 ${postId}) 삭제 성공:`, { userId });
        res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error(`댓글 ${commentId} 삭제 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// POST /api/posts/:postId/like - 게시글 좋아요 추가 (REQ06_NOTICE_BOARD_09, 인증 필요)
router.post('/:postId/like', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 게시글 존재 여부 확인 (선택적이지만 안전)
        const [postExists] = await connection.query('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ message: '좋아요를 누를 게시글을 찾을 수 없습니다.' });
        }

        // 이미 좋아요를 눌렀는지 확인 후 추가 (UNIQUE KEY 제약 조건 활용)
        try {
            await connection.query(
                'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
                [userId, postId]
            );
            console.log(`사용자 ${userId}가 게시글 ${postId} 좋아요 추가`);
            // 좋아요 성공 시 현재 총 좋아요 수 반환 (선택적)
             const [likeCountResult] = await connection.query('SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?', [postId]);
             res.status(201).json({ message: '좋아요 추가 성공', likeCount: likeCountResult[0].likeCount });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                // 이미 좋아요 누른 경우 - 에러 대신 성공으로 간주하거나, 이미 눌렀다는 메시지 반환 가능
                console.log(`사용자 ${userId}는 게시글 ${postId}에 이미 좋아요를 눌렀습니다.`);
                 const [likeCountResult] = await connection.query('SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?', [postId]);
                 res.status(200).json({ message: '이미 좋아요를 누른 상태입니다.', likeCount: likeCountResult[0].likeCount });
            } else {
                // 기타 DB 오류
                throw error; // 아래 catch 블록에서 처리하도록 다시 던짐
            }
        }
    } catch (error) {
        console.error(`게시글 ${postId} 좋아요 추가 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// DELETE /api/posts/:postId/like - 게시글 좋아요 취소 (REQ06_NOTICE_BOARD_09, 인증 필요)
router.delete('/:postId/like', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 좋아요 기록 삭제 시도
        const [deleteResult] = await connection.query(
            'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (deleteResult.affectedRows > 0) {
            console.log(`사용자 ${userId}가 게시글 ${postId} 좋아요 취소`);
             const [likeCountResult] = await connection.query('SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?', [postId]);
             res.status(200).json({ message: '좋아요 취소 성공', likeCount: likeCountResult[0].likeCount });
        } else {
            // 삭제할 좋아요 기록이 없는 경우 (이미 취소했거나 누른 적 없음)
            console.log(`사용자 ${userId}는 게시글 ${postId}의 좋아요를 취소할 수 없거나 이미 취소했습니다.`);
             const [likeCountResult] = await connection.query('SELECT COUNT(*) as likeCount FROM likes WHERE post_id = ?', [postId]);
             res.status(200).json({ message: '좋아요를 누르지 않았거나 이미 취소했습니다.', likeCount: likeCountResult[0].likeCount });
        }
    } catch (error) {
        console.error(`게시글 ${postId} 좋아요 취소 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// POST /api/posts/:postId/scrap - 게시글 스크랩 추가 (REQ06_NOTICE_BOARD_10, 인증 필요)
router.post('/:postId/scrap', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 게시글 존재 여부 확인 (선택적)
        const [postExists] = await connection.query('SELECT id FROM posts WHERE id = ?', [postId]);
        if (postExists.length === 0) {
            return res.status(404).json({ message: '스크랩할 게시글을 찾을 수 없습니다.' });
        }

        // 이미 스크랩했는지 확인 후 추가 (UNIQUE KEY 제약 조건 활용)
        try {
            await connection.query(
                'INSERT INTO scraps (user_id, post_id) VALUES (?, ?)',
                [userId, postId]
            );
            console.log(`사용자 ${userId}가 게시글 ${postId} 스크랩 추가`);
            // 스크랩 성공 시 현재 총 스크랩 수 반환 (필요 시 구현)
            // const [scrapCountResult] = await connection.query('SELECT COUNT(*) as scrapCount FROM scraps WHERE post_id = ?', [postId]);
            res.status(201).json({ message: '스크랩 추가 성공' /*, scrapCount: scrapCountResult[0].scrapCount */ });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log(`사용자 ${userId}는 게시글 ${postId}을 이미 스크랩했습니다.`);
                // const [scrapCountResult] = await connection.query('SELECT COUNT(*) as scrapCount FROM scraps WHERE post_id = ?', [postId]);
                res.status(200).json({ message: '이미 스크랩한 게시글입니다.' /*, scrapCount: scrapCountResult[0].scrapCount */ });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error(`게시글 ${postId} 스크랩 추가 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// DELETE /api/posts/:postId/scrap - 게시글 스크랩 취소 (REQ06_NOTICE_BOARD_10, 인증 필요)
router.delete('/:postId/scrap', authenticateToken, async (req, res) => {
    const postId = req.params.postId;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await pool.getConnection();

        // 스크랩 기록 삭제 시도
        const [deleteResult] = await connection.query(
            'DELETE FROM scraps WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (deleteResult.affectedRows > 0) {
            console.log(`사용자 ${userId}가 게시글 ${postId} 스크랩 취소`);
            // const [scrapCountResult] = await connection.query('SELECT COUNT(*) as scrapCount FROM scraps WHERE post_id = ?', [postId]);
            res.status(200).json({ message: '스크랩 취소 성공' /*, scrapCount: scrapCountResult[0].scrapCount */ });
        } else {
            console.log(`사용자 ${userId}는 게시글 ${postId}의 스크랩을 취소할 수 없거나 이미 취소했습니다.`);
            // const [scrapCountResult] = await connection.query('SELECT COUNT(*) as scrapCount FROM scraps WHERE post_id = ?', [postId]);
            res.status(200).json({ message: '스크랩하지 않았거나 이미 취소했습니다.' /*, scrapCount: scrapCountResult[0].scrapCount */ });
        }
    } catch (error) {
        console.error(`게시글 ${postId} 스크랩 취소 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// GET /api/scraps/me - 내가 스크랩한 글 목록 조회 (인증 필요)
router.get('/scraps/me', authenticateToken, async (req, res) => {
    // 이 라우터는 '/api/posts'가 아닌 별도 경로 (예: '/api/scraps')로 분리하는 것이 더 좋을 수 있음
    // 여기서는 일단 posts.js 에 임시로 추가
    const userId = req.user.userId;

    try {
        const [scrappedPosts] = await pool.query(
            `SELECT p.id, p.title, p.created_at, u.username
             FROM posts p
             JOIN users u ON p.user_id = u.id
             JOIN scraps s ON p.id = s.post_id
             WHERE s.user_id = ?
             ORDER BY s.created_at DESC`, // 스크랩한 시간 순 정렬
             [userId]
        );
        res.status(200).json(scrappedPosts);
    } catch (error) {
        console.error(`사용자 ${userId}의 스크랩 목록 조회 중 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
    // finally 에서 connection release 필요 (pool 직접 사용 시 자동 관리될 수도 있음)
});

module.exports = router;