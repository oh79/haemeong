const { PrismaClient } = require('@prisma/client'); // 표준 import 사용
// const { PrismaClient } = require('../node_modules/.prisma/client'); // 생성된 경로에서 직접 import 시도 -> 원복

// Prisma Client 인스턴스를 저장할 전역 변수 선언
// globalThis는 Node.js와 브라우저 환경 모두에서 사용 가능한 전역 객체입니다.
const globalForPrisma = globalThis;

console.log('[lib/prisma.js] Initializing Prisma Client...'); // 로그 메시지 원복
// globalForPrisma에 prisma 인스턴스가 없으면 새로 생성하고, 있으면 기존 인스턴스 사용
const prisma = globalForPrisma.prisma || new PrismaClient({
    // 로그 설정 (선택적)
    // log: ['query', 'info', 'warn', 'error'],
});
console.log('[lib/prisma.js] Prisma Client instance created.');
// 생성된 prisma 인스턴스의 키 목록을 출력 (모델 속성이 포함되어 있는지 확인)
console.log('[lib/prisma.js] Prisma instance keys:', Object.keys(prisma));

// 개발 환경에서는 globalForPrisma.prisma에 인스턴스를 할당하여
// 다음 핫 리로드 시 인스턴스를 재사용할 수 있도록 함
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

module.exports = prisma; 