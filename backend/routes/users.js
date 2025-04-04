const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const authenticateToken = require('../middleware/authMiddleware'); // 인증 미들웨어

const router = express.Router();
const saltRounds = 10;

// GET /api/users/me - 내 정보 조회 (확장용, 현재는 Profile 컴포넌트에서 localStorage 사용 중)
// 필요하다면 이 API를 구현해서 DB에서 최신 정보를 가져오도록 할 수 있음
router.get('/me', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    try {
        const [users] = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        res.status(200).json(users[0]);
    } catch (error) {
        console.error(`사용자 ${userId} 정보 조회 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


// PUT /api/users/me - 내 정보 수정 (username, email) (REQ07_PROFILE_02)
router.put('/me', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { username, email } = req.body;

    // 1. 입력값 검증
    if ((!username || username.trim() === '') && (!email || email.trim() === '')) {
        return res.status(400).json({ message: '변경할 사용자 이름 또는 이메일을 입력해주세요.' });
    }
    // 간단한 이메일 형식 검증 (더 엄격한 검증 필요 시 라이브러리 사용)
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: '유효하지 않은 이메일 형식입니다.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // 트랜잭션 시작

        // 2. 변경하려는 username 또는 email 중복 확인 (자기 자신 제외)
        const updates = {}; // 변경할 필드만 담을 객체
        const params = [];
        const conditions = [];

        if (username && username.trim() !== '') {
            updates.username = username.trim();
            params.push(updates.username);
            conditions.push('username = ?');
        }
        if (email && email.trim() !== '') {
            updates.email = email.trim();
            params.push(updates.email);
            conditions.push('email = ?');
        }

        if (params.length > 0) {
            params.push(userId); // 마지막 파라미터는 현재 사용자 ID
            const checkSql = `SELECT id, username, email FROM users WHERE (${conditions.join(' OR ')}) AND id != ?`;
            const [existingUsers] = await connection.query(checkSql, params);

            if (existingUsers.length > 0) {
                let message = '';
                if (updates.username && existingUsers[0].username === updates.username) {
                    message = '이미 사용 중인 사용자 이름입니다.';
                } else {
                    message = '이미 사용 중인 이메일입니다.';
                }
                await connection.rollback(); // 중복 시 롤백
                return res.status(409).json({ message });
            }
        } else {
             await connection.rollback(); // 변경할 내용이 없으면 롤백
             return res.status(400).json({ message: '변경할 사용자 이름 또는 이메일을 입력해주세요.' });
        }


        // 3. 사용자 정보 업데이트
        const updateSql = 'UPDATE users SET ? WHERE id = ?';
        await connection.query(updateSql, [updates, userId]);

        await connection.commit(); // 트랜잭션 커밋

        // 4. 수정된 사용자 정보 반환 (password 제외)
        const [updatedUser] = await connection.query(
             'SELECT id, username, email, created_at FROM users WHERE id = ?',
             [userId]
        );

        console.log(`사용자 ${userId} 정보 수정 성공`);
        res.status(200).json({ message: '정보가 성공적으로 수정되었습니다.', user: updatedUser[0] });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`사용자 ${userId} 정보 수정 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});


// PUT /api/users/me/password - 비밀번호 변경 (REQ07_PROFILE_02)
router.put('/me/password', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // 1. 입력값 검증
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 2. 현재 비밀번호 확인
        const [users] = await connection.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' }); // 비정상 케이스
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
        }

        // 3. 새 비밀번호 해싱 및 업데이트
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        await connection.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, userId]
        );

        console.log(`사용자 ${userId} 비밀번호 변경 성공`);
        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error(`사용자 ${userId} 비밀번호 변경 오류:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) connection.release();
    }
});


module.exports = router;
