// backend/routes/posts.js

const express = require('express');
// const pool = require('../config/db'); // 더 이상 사용 안 함
// const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware'); // 기존 방식 주석 처리
const authMiddleware = require('../middleware/authMiddleware'); // 모듈 전체를 임포트
const multer = require('multer'); // multer 추가
const path = require('path');   // path 모듈 추가
const fs = require('fs');       // fs 모듈 추가 (디렉토리 생성용)
const prisma = require('../lib/prisma'); // 싱글톤 Prisma Client 인스턴스 가져오기

const router = express.Router();

// --- Multer 설정 ---
// 이미지 저장 경로 설정 (예: backend/uploads/posts/)
const uploadDir = path.join(__dirname, '..', 'uploads', 'posts');
// uploads 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // 이미지를 저장할 디렉토리
  },
  filename: function (req, file, cb) {
    // 파일 이름 중복 방지: 필드명-타임스탬프.확장자
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 파일 크기 제한 (예: 5MB)
});
// ------------------

// GET /api/posts - 게시글 목록 조회 (첫 번째 이미지 URL 포함)
router.get('/', async (req, res) => {
    console.log("[posts.js GET /] Handler entered"); // 핸들러 진입 로그
    console.log("[posts.js GET /] typeof prisma:", typeof prisma); // prisma 타입 확인
    console.log("[posts.js GET /] prisma object keys:", prisma ? Object.keys(prisma) : 'prisma is null or undefined'); // prisma 객체 키 확인
    console.log("[posts.js GET /] typeof prisma.posts:", typeof prisma?.posts); // prisma.posts 타입 확인

    const searchQuery = req.query.search || '';
    try {
        console.log("[posts.js GET /] Attempting prisma.posts.findMany..."); // post -> posts
        const posts = await prisma.posts.findMany({ // post -> posts
            where: {
                OR: [
                    { title: { contains: searchQuery } },
                    { content: { contains: searchQuery } },
                ],
            },
            include: {
                users: { select: { username: true /*, location: true */ } }, // location 제거
                _count: { // 좋아요, 댓글 수 집계
                    select: { likes: true, comments: true }, // likes, comments 모델 참조 확인
                },
                images: { // post_images -> images (관계 필드 이름 사용)
                    orderBy: { created_at: 'asc' },
                    take: 1, // 첫 번째 이미지만 가져오기
                    select: { url: true } // URL만 선택
                }
            },
            orderBy: { created_at: 'desc' },
        });
        console.log("[posts.js GET /] prisma.posts.findMany successful"); // post -> posts

        // 각 post 객체에 imageUrl 추가 및 카운트 필드 이름 변경 (안정성 강화)
        const formattedPosts = posts.map(post => ({
            id: post.id,
            title: post.title,
            // content는 목록에서는 필요 없을 수 있음
            username: post.users?.username || '익명',
            createdAt: post.created_at, // 필드명 일관성 유지 (혹은 formatDate)
            likeCount: post._count?.likes ?? 0, // null 병합 연산자
            commentCount: post._count?.comments ?? 0, // null 병합 연산자
            // images 배열의 첫 번째 요소의 url을 imageUrl로 사용 (안정성 강화)
            imageUrl: Array.isArray(post.images) && post.images.length > 0 ? post.images[0]?.url : null, // post_images -> images
        }));

        res.status(200).json(formattedPosts);
    } catch (error) {
        console.error('게시글 목록 조회 오류:', error); // 전체 에러 객체 로깅
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

// POST /api/posts - 새 게시글 작성 (이미지 업로드 포함)
// upload.array('images', 5) -> 'images' 필드 이름으로 최대 5개 파일 받음
router.post('/', authMiddleware.authenticateToken, upload.array('images', 5), async (req, res) => {
    console.log("[posts.js POST /] Handler entered"); // 핸들러 진입 로그
    console.log("[posts.js POST /] typeof prisma:", typeof prisma); // prisma 타입 확인
    console.log("[posts.js POST /] prisma object keys:", prisma ? Object.keys(prisma) : 'prisma is null or undefined'); // prisma 객체 키 확인
    console.log("[posts.js POST /] typeof prisma.posts:", typeof prisma?.posts); // prisma.posts 타입 확인

    const { title, content } = req.body;
    const userId = req.user?.userId; // 옵셔널 체이닝 추가
    const files = req.files; // 업로드된 파일 정보 배열

    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }
    // userId 존재 여부 확인 강화
    if (!userId) {
        console.warn('POST /api/posts 호출 시 userId 누락'); // 서버 로그 추가
        return res.status(401).json({ message: '사용자 인증 정보가 없습니다.' });
    }

    try {
        const newPost = await prisma.posts.create({ // post -> posts
            data: {
                title,
                content,
                user_id: userId,
            },
        });

        // 이미지 정보 DB 저장 (파일이 있는 경우)
        if (files && files.length > 0) {
            const imagePromises = files.map(file => {
                // 클라이언트에서 접근 가능한 이미지 URL 생성 (예: /uploads/posts/파일명)
                // 실제 프로덕션에서는 CDN 주소나 S3 주소가 될 것임
                const imageUrl = `/uploads/posts/${file.filename}`;
                return prisma.post_images.create({ // post_images 모델 사용 확인
                    data: {
                        url: imageUrl,
                        post_id: newPost.id,
                    }
                });
            });
            await Promise.all(imagePromises);
        }

        // 새로 생성된 게시글 정보 반환 (id 포함)
        res.status(201).json({ id: newPost.id, title: newPost.title, message: '게시글이 성공적으로 작성되었습니다.' });

    } catch (error) {
        console.error('게시글 작성 오류:', error); // 전체 에러 객체 로깅
        // 업로드된 파일 삭제 (롤백) - 필요시 구현
        if (files && files.length > 0) {
            files.forEach(file => {
                fs.unlink(path.join(uploadDir, file.filename), (err) => {
                    if (err) console.error("롤백 중 파일 삭제 실패:", err);
                });
            });
        }
        res.status(500).json({ message: '게시글 작성 중 오류 발생' });
    }
});

// GET /api/posts/:postId - 상세 조회 (이미지 URL 목록 포함)
router.get('/:postId', authMiddleware.optionalAuthenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const currentUserId = req.user?.userId; // 로그인한 사용자 ID (선택적)

    if (isNaN(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    }

    try {
        const post = await prisma.posts.findUnique({ // post -> posts
            where: { id: postId },
            include: {
                users: { select: { id: true, username: true, avatarUrl: true} }, // user -> users
                comments: { // comments (스키마 확인 필요)
                    include: { users: { select: { id: true, username: true, avatarUrl: true } } }, // user -> users
                    orderBy: { created_at: 'asc' }
                },
                images: { // post_images -> images (관계 필드 이름 사용)
                    select: { url: true },
                    orderBy: { created_at: 'asc' }
                },
                _count: { // 좋아요 수
                    select: { likes: true }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }

        // 로그인 상태일 경우, 좋아요/스크랩 여부 확인
        let likedByUser = false;
        let scrappedByUser = false;
        if (currentUserId) {
            // 에러 핸들링 추가 가능성 (findUnique가 null 반환)
            const like = await prisma.likes.findUnique({ // likes 모델 확인
                where: { user_id_post_id: { user_id: currentUserId, post_id: postId } } // 기본 복합 필드 이름 사용
            });
            likedByUser = !!like;

            const scrap = await prisma.scraps.findUnique({ // scraps 모델 확인
                where: { user_id_post_id: { user_id: currentUserId, post_id: postId } } // 기본 복합 필드 이름 사용
            });
            scrappedByUser = !!scrap;
        }

        // 최종 응답 데이터 구성 (안정성 강화)
        const responseData = {
            id: post.id,
            user_id: post.users?.id, // user -> users
            username: post.users?.username || '익명', // user -> users
            userAvatarUrl: post.users?.avatarUrl, // user -> users
            title: post.title,
            content: post.content,
            created_at: post.created_at,
            updated_at: post.updated_at,
            comments: Array.isArray(post.comments) ? post.comments.map(c => ({ 
                id: c.id,
                user_id: c.users?.id, // user -> users
                username: c.users?.username || '익명', // user -> users
                userAvatarUrl: c.users?.avatarUrl, // user -> users
                content: c.content,
                created_at: c.created_at
            })) : [],
            imageUrls: Array.isArray(post.images) ? post.images.map(img => img.url) : [], // post_images -> images
            likeCount: post._count?.likes ?? 0, // null 병합 연산자
            // 로그인 상태 따라 추가 정보 포함
            ...(currentUserId && { likedByUser, scrappedByUser }) // !! 주의: likedByUser, scrappedByUser 자체가 boolean이므로 추가 검증 불필요
        };

        res.status(200).json(responseData);

    } catch (error) {
        console.error(`게시글 ${postId} 조회 오류:`, error); // 전체 에러 객체 로깅
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// PUT /api/posts/:postId - 게시글 수정 (이미지 수정은 일단 제외)
// 기존 이미지 처리는 더 복잡하므로 여기서는 title, content만 수정
router.put('/:postId', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const { title, content } = req.body;
    const userId = req.user?.userId; // 옵셔널 체이닝 추가

    if (isNaN(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    }
    if (!title || !content) {
        return res.status(400).json({ message: '제목과 내용을 모두 입력해야 합니다.' });
    }
    // userId 확인 추가
    if (!userId) {
        return res.status(403).json({ message: '수정 권한이 없습니다 (사용자 정보 없음).' });
    }

    try {
        // 게시글 존재 및 소유권 확인
        const post = await prisma.posts.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
        if (post.user_id !== userId) {
            return res.status(403).json({ message: '이 게시글을 수정할 권한이 없습니다.' });
        }

        // 게시글 업데이트 (title, content만)
        const updatedPost = await prisma.posts.update({ // post -> posts
            where: { id: postId },
            data: {
                title,
                content,
                updated_at: new Date() // 수정 시간 업데이트
            },
        });

        res.status(200).json(updatedPost);

    } catch (error) {
        console.error(`게시글 ${postId} 수정 오류:`, error); // 전체 에러 객체 로깅
        res.status(500).json({ message: '게시글 수정 중 오류 발생' });
    }
});

// DELETE /api/posts/:postId - 게시글 삭제
router.delete('/:postId', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.userId; // 옵셔널 체이닝 추가

    if (isNaN(postId)) {
        return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    }
    // userId 확인 추가
    if (!userId) {
        return res.status(403).json({ message: '삭제 권한이 없습니다 (사용자 정보 없음).' });
    }

    try {
        // 게시글 존재 및 소유권 확인
        const post = await prisma.posts.findUnique({ // post -> posts
            where: { id: postId },
            select: { user_id: true } // 작성자 ID만 필요
        });
        if (!post) {
            return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        }
        if (post.user_id !== userId) {
            return res.status(403).json({ message: '이 게시글을 삭제할 권한이 없습니다.' });
        }

        // 연결된 이미지 파일 삭제 (선택적이지만 권장)
        const images = await prisma.post_images.findMany({ // post_images 모델 확인
            where: { post_id: postId },
            select: { url: true }
        });
        if (Array.isArray(images) && images.length > 0) {
            const imageDeletePromises = images.map(image => {
                // URL에서 파일 이름 추출 (간단한 예시, 실제 URL 구조에 맞게 조정 필요)
                if (!image.url) return Promise.resolve(); // URL 없으면 스킵
                const filename = path.basename(image.url);
                const imagePath = path.join(uploadDir, filename);
                return fs.promises.unlink(imagePath).catch(err => {
                    // 파일이 없거나 삭제 중 오류 발생해도 일단 계속 진행
                    console.warn(`이미지 파일 삭제 실패 (${imagePath}):`, err.message);
                });
            });
            await Promise.all(imageDeletePromises);
        }

        // 게시글 삭제 (연관된 이미지 레코드도 Cascade로 자동 삭제 설정 가정)
        await prisma.posts.delete({ // post -> posts
            where: { id: postId },
        });

        res.status(200).json({ message: '게시글이 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error(`게시글 ${postId} 삭제 오류:`, error); // 전체 에러 객체 로깅
        // Prisma 에러 코드 확인 (예: P2025 Record to delete does not exist.)
        if (error.code === 'P2025') {
             return res.status(404).json({ message: '삭제할 게시글을 찾을 수 없습니다.' });
        }
        res.status(500).json({ message: '게시글 삭제 중 오류 발생' });
    }
});

// POST /api/posts/:postId/comments - 새 댓글 작성
router.post('/:postId/comments', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10); // INT로 변환
    const { content } = req.body;
    const userId = req.user?.userId; // 옵셔널 체이닝

    if (isNaN(postId)) return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    if (!content || content.trim() === '') return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    if (!userId) return res.status(401).json({ message: '댓글 작성 권한이 없습니다.' });

    try {
        // 게시글 존재 여부 확인
        const postExists = await prisma.posts.findUnique({ where: { id: postId } });
        if (!postExists) {
            return res.status(404).json({ message: '댓글을 작성할 게시글을 찾을 수 없습니다.' });
        }

        // 새 댓글 생성
        const newComment = await prisma.comments.create({ // comments 모델 확인
            data: {
                content,
                post_id: postId,
                user_id: userId,
            },
            include: { users: { select: { id: true, username: true /*, avatarUrl: true */ } } } // avatarUrl 제거
        });

        // 응답 데이터 가공 (필요시)
        const responseData = {
            id: newComment.id,
            content: newComment.content,
            created_at: newComment.created_at,
            user_id: newComment.users.id,
            username: newComment.users.username,
        };

        console.log(`게시글 ${postId}에 새 댓글 작성 성공:`, { id: newComment.id, userId });
        res.status(201).json(responseData);

    } catch (error) {
        console.error(`게시글 ${postId} 댓글 작성 중 오류:`, error); // 전체 에러 로깅
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// PUT /api/posts/:postId/comments/:commentId - 댓글 수정
router.put('/:postId/comments/:commentId', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { content } = req.body;
    const userId = req.user?.userId; // 옵셔널 체이닝

    if (isNaN(postId) || isNaN(commentId)) return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
    if (!content || content.trim() === '') return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
    if (!userId) return res.status(403).json({ message: '댓글 수정 권한이 없습니다.' });

    try {
        // 댓글 존재 여부 및 소유권 확인
        const comment = await prisma.comments.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: '수정할 댓글을 찾을 수 없습니다.' });
        }
         if (comment.post_id !== postId) {
            return res.status(404).json({ message: '게시글에 해당 댓글이 없습니다.' });
        }
        if (comment.user_id !== userId) {
            return res.status(403).json({ message: '댓글을 수정할 권한이 없습니다.' });
        }

        // 댓글 업데이트
        const updatedComment = await prisma.comments.update({ // comments 모델 확인
            where: { id: commentId },
            data: { content },
            include: { users: { select: { id: true, username: true /*, avatarUrl: true */ } } } // avatarUrl 제거
        });

        // 응답 데이터 가공
        const responseData = {
            id: updatedComment.id,
            content: updatedComment.content,
            created_at: updatedComment.created_at, // 수정 시간 필드가 있다면 그것도 포함 (updated_at)
            user_id: updatedComment.users.id,
            username: updatedComment.users.username,
        };


        console.log(`댓글 ${commentId} (게시글 ${postId}) 수정 성공:`, { userId });
        res.status(200).json(responseData);

    } catch (error) {
        console.error(`댓글 ${commentId} 수정 중 오류:`, error); // 전체 에러 로깅
         if (error.code === 'P2025') { // Prisma: Record to delete does not exist.
             return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다.' });
        }
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// DELETE /api/posts/:postId/comments/:commentId - 댓글 삭제
router.delete('/:postId/comments/:commentId', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user?.userId; // 옵셔널 체이닝

    if (isNaN(postId) || isNaN(commentId)) return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
    if (!userId) return res.status(403).json({ message: '댓글 삭제 권한이 없습니다.' });


    try {
        // 댓글 존재 여부 및 소유권 확인
        const comment = await prisma.comments.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다.' });
        }
         if (comment.post_id !== postId) {
            return res.status(404).json({ message: '게시글에 해당 댓글이 없습니다.' });
        }
        if (comment.user_id !== userId) {
            return res.status(403).json({ message: '댓글을 삭제할 권한이 없습니다.' });
        }

        // 댓글 삭제
        await prisma.comments.delete({
            where: { id: commentId }
        });

        console.log(`댓글 ${commentId} (게시글 ${postId}) 삭제 성공:`, { userId });
        res.status(200).json({ message: '댓글이 성공적으로 삭제되었습니다.' });

    } catch (error) {
        console.error(`댓글 ${commentId} 삭제 중 오류:`, error); // 전체 에러 로깅
         if (error.code === 'P2025') { // Prisma: Record to delete does not exist.
             return res.status(404).json({ message: '삭제할 댓글을 찾을 수 없습니다.' });
        }
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// POST /api/posts/:postId/like - 게시글 좋아요 추가/삭제 토글
router.post('/:postId/like', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.userId; // 옵셔널 체이닝

    if (isNaN(postId)) return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    if (!userId) return res.status(401).json({ message: '좋아요 권한이 없습니다.' });

    try {
        // 게시글 존재 확인
        const postExists = await prisma.posts.findUnique({ where: { id: postId } });
        if (!postExists) {
            return res.status(404).json({ message: '좋아요를 누를 게시글을 찾을 수 없습니다.' });
        }

        // 기존 좋아요 확인
        const existingLike = await prisma.likes.findUnique({
            where: { user_id_post_id: { user_id: userId, post_id: postId } }
        });

        if (existingLike) {
            // 좋아요 취소
            await prisma.likes.delete({
                where: { user_id_post_id: { user_id: userId, post_id: postId } }
            });
            console.log(`사용자 ${userId}가 게시글 ${postId} 좋아요 취소`);
            // 현재 좋아요 수 다시 계산
            const likeCount = await prisma.likes.count({ where: { post_id: postId } });
            res.status(200).json({ liked: false, likeCount });
        } else {
            // 좋아요 추가
            await prisma.likes.create({
                data: { user_id: userId, post_id: postId }
            });
            console.log(`사용자 ${userId}가 게시글 ${postId} 좋아요 추가`);
            // 현재 좋아요 수 다시 계산
            const likeCount = await prisma.likes.count({ where: { post_id: postId } });
            res.status(201).json({ liked: true, likeCount }); // 201 Created 또는 200 OK 사용 가능
        }
    } catch (error) {
        console.error(`게시글 ${postId} 좋아요 처리 중 오류:`, error); // 전체 에러 로깅
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// DELETE /api/posts/:postId/like 라우트는 POST 라우트와 통합되었으므로 주석 처리 또는 삭제
/*
router.delete('/:postId/like', authMiddleware.authenticateToken, async (req, res) => {
    // ... 기존 삭제 로직 ... (이제 POST에서 토글로 처리)
});
*/


// POST /api/posts/:postId/scrap - 게시글 스크랩 추가/삭제 토글
router.post('/:postId/scrap', authMiddleware.authenticateToken, async (req, res) => {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.userId; // 옵셔널 체이닝

    if (isNaN(postId)) return res.status(400).json({ message: '잘못된 게시글 ID입니다.' });
    if (!userId) return res.status(401).json({ message: '스크랩 권한이 없습니다.' });

    try {
        // 게시글 존재 확인
        const postExists = await prisma.posts.findUnique({ where: { id: postId } });
        if (!postExists) {
            return res.status(404).json({ message: '스크랩할 게시글을 찾을 수 없습니다.' });
        }

        // 기존 스크랩 확인
        const existingScrap = await prisma.scraps.findUnique({
            where: { user_id_post_id: { user_id: userId, post_id: postId } }
        });

        if (existingScrap) {
            // 스크랩 취소
            await prisma.scraps.delete({
                where: { user_id_post_id: { user_id: userId, post_id: postId } }
            });
            console.log(`사용자 ${userId}가 게시글 ${postId} 스크랩 취소`);
            res.status(200).json({ scrapped: false });
        } else {
            // 스크랩 추가
            await prisma.scraps.create({
                data: { user_id: userId, post_id: postId }
            });
            console.log(`사용자 ${userId}가 게시글 ${postId} 스크랩 추가`);
            res.status(201).json({ scrapped: true }); // 201 Created 또는 200 OK 사용 가능
        }
    } catch (error) {
        console.error(`게시글 ${postId} 스크랩 처리 중 오류:`, error); // 전체 에러 로깅
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// DELETE /api/posts/:postId/scrap 라우트는 POST 라우트와 통합되었으므로 주석 처리 또는 삭제
/*
router.delete('/:postId/scrap', authMiddleware.authenticateToken, async (req, res) => {
    // ... 기존 삭제 로직 ... (이제 POST에서 토글로 처리)
});
*/


// GET /api/scraps/me 라우트는 scraps.js 로 이동되었으므로 삭제

module.exports = router;