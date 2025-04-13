const express = require('express');
const bcrypt = require('bcrypt');
// const pool = require('../config/db'); // -> Prisma 사용
const prisma = require('../lib/prisma'); // 싱글톤 Prisma Client 인스턴스 사용
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const saltRounds = 10;

// GET /api/users/me - 내 정보 조회
router.get('/me', authMiddleware.authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        // Prisma 사용 (select로 password 제외)
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { 
                id: true, 
                username: true, 
                email: true, 
                created_at: true, 
                avatarUrl: true, // 스키마 필드 확인
            } 
        });
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(`사용자 ${userId} 정보 조회 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// PUT /api/users/me - 내 정보 수정 (username, email, location, avatarUrl 등)
router.put('/me', authMiddleware.authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    // 수정 가능한 필드 목록 (요청 본문에서 가져옴)
    const { username, email, avatarUrl } = req.body;

    // 1. 변경할 데이터 준비 (존재하는 필드만)
    const dataToUpdate = {};
    if (username?.trim()) dataToUpdate.username = username.trim();
    if (email?.trim()) {
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
        }
        dataToUpdate.email = email.trim();
    }
    if (avatarUrl?.trim()) dataToUpdate.avatarUrl = avatarUrl.trim(); // 스키마 필드 확인

    // 변경할 내용이 없으면 에러 반환
    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: '변경할 정보가 없습니다.' });
    }

    try {
        // 2. 변경하려는 username 또는 email 중복 확인 (자기 자신 제외)
        if (dataToUpdate.username || dataToUpdate.email) {
            const orConditions = [];
            if (dataToUpdate.username) orConditions.push({ username: dataToUpdate.username });
            if (dataToUpdate.email) orConditions.push({ email: dataToUpdate.email });

            const existingUser = await prisma.users.findFirst({
                where: {
                    OR: orConditions,
                    NOT: { id: userId } // 현재 사용자 제외
                }
            });

            if (existingUser) {
                let message = '';
                if (dataToUpdate.username && existingUser.username === dataToUpdate.username) {
                    message = '이미 사용 중인 사용자 이름입니다.';
                } else {
                    message = '이미 사용 중인 이메일입니다.';
                }
                return res.status(409).json({ message });
            }
        }

        // 3. 사용자 정보 업데이트 (Prisma 사용)
        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { 
                id: true, username: true, email: true, created_at: true, avatarUrl: true    
            }
        });

        console.log(`사용자 ${userId} 정보 수정 성공`);
        res.status(200).json({ message: '정보가 성공적으로 수정되었습니다.', user: updatedUser });

    } catch (error) {
        console.error(`사용자 ${userId} 정보 수정 오류:`, error);
         // Prisma 에러 코드 처리 (예: P2025 - 업데이트할 레코드 없음)
        if (error.code === 'P2025') {
             return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// PUT /api/users/me/password - 비밀번호 변경
router.put('/me/password', authMiddleware.authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' });
    }

    try {
        // 2. 현재 사용자 정보 가져오기 (비밀번호 포함)
        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' }); 
        }

        // 현재 비밀번호 확인
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
        }

        // 3. 새 비밀번호 해싱 및 업데이트 (Prisma 사용)
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        await prisma.users.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        console.log(`사용자 ${userId} 비밀번호 변경 성공`);
        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error(`사용자 ${userId} 비밀번호 변경 오류:`, error);
         if (error.code === 'P2025') {
             return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// POST /api/users/me/verify-password - 현재 비밀번호 확인
router.post('/me/verify-password', authMiddleware.authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    try {
        // 2. 사용자 정보 조회 (Prisma 사용)
        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 3. 입력된 비밀번호와 저장된 해시 비밀번호 비교
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log(`사용자 ${userId} 비밀번호 확인 실패`);
            return res.status(401).json({ message: '비밀번호가 올바르지 않습니다.' });
        }

        console.log(`사용자 ${userId} 비밀번호 확인 성공`);
        res.status(200).json({ message: '비밀번호가 확인되었습니다.' });

    } catch (error) {
        console.error(`사용자 ${userId} 비밀번호 확인 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
