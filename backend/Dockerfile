# 1. Node.js 18 버전 이미지 사용
FROM node:18

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json과 package-lock.json 먼저 복사 (lock 파일 추가)
COPY package.json ./
COPY prisma ./prisma/

# 4. 의존성 설치
RUN npm install

# 5. Prisma Client 생성 -> 삭제 (아래 중복 실행 제거)
# RUN ./node_modules/.bin/prisma generate

# 6. 나머지 애플리케이션 소스 복사
COPY . .

# Prisma Client 미리 생성 (런타임 대신 빌드 타임) -> 제거 (entrypoint.sh에서 실행하도록 변경)
# RUN npm exec -- prisma generate

# 7. entrypoint 스크립트 권한 부여
RUN chmod +x ./entrypoint.sh

# 8. 포트 설정 (백엔드: 예: 5000)
EXPOSE 5000

# 9. Entrypoint 설정
ENTRYPOINT ["./entrypoint.sh"]

# 10. 기본 실행 명령어 (Entrypoint의 "$@"로 전달됨)
# CMD ["npm", "run", "dev"]
CMD ["node","server.js"]