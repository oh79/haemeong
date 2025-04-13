#!/bin/bash

# DB가 준비될 때까지 기다리는 로직 (선택적이지만 권장)
# 예시: mysqladmin을 사용 (apt-get install default-mysql-client 필요할 수 있음)
# while ! mysqladmin ping -h"mysql" -P"3306" --silent; do
#     echo "Waiting for database connection..."
#     sleep 2
# done

echo "Skipping Prisma Client generation (moved to Dockerfile build stage)."
# echo "Ensuring clean Prisma Client generation..."
# # 이전 생성된 클라이언트 강제 삭제 (혹시 모를 캐시 문제 방지) -> Dockerfile 빌드 시 생성되므로 제거
# rm -rf node_modules/.prisma/client
# 
# echo "Generating Prisma Client using project's Prisma CLI..."
# # 프로젝트에 설치된 Prisma CLI 사용 -> Dockerfile 빌드 시 생성되므로 제거
# npm exec -- prisma generate
# # 생성 후 혹시 모를 파일 시스템 딜레이 위해 잠시 대기 (선택적)
# sleep 1

echo "Applying database migrations..."
# 프로젝트에 설치된 Prisma CLI 사용
npm exec -- prisma migrate deploy
# 마이그레이션 명령어의 종료 코드를 확인
if [ $? -ne 0 ]; then
  echo "Database migration failed. Exiting."
  exit 1 # 마이그레이션 실패 시 컨테이너 종료
fi

echo "Generating Prisma Client in runtime environment..."
# 프로젝트에 설치된 Prisma CLI 사용하여 런타임 시 클라이언트 생성
npm exec -- prisma generate

echo "Starting the application..."
# 원래 CMD에서 실행하던 명령어 실행
exec "$@"