# 1. Node.js 22 버전 이미지 사용
FROM node:22

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. package.json만 복사
#    (package-lock.json 없으니 COPY package*.json 대신 package.json만 가져와도 무관)
COPY package.json ./

# 4. 의존성 설치
#    로컬 node_modules가 없으므로, 여기서 새롭게 설치됨
RUN npm install

# 5. 애플리케이션 소스 복사
COPY . .

# 6. 포트 설정 (백엔드: 예: 5000)
EXPOSE 5000

# 7. 실행 명령어
CMD ["npm", "run", "dev"]
