import React from 'react';
import { Container, useBreakpointValue } from '@chakra-ui/react';

const Layout = ({ children }) => {
  // 현재 breakpoint 값 가져오기
  const displayMode = useBreakpointValue({ base: 'mobile', md: 'desktop' });
  const isMobile = displayMode === 'mobile';

  // 네비게이션 높이 (px 단위) - Navbar.jsx 스타일에 맞춰 조정
  const desktopHeaderHeight = 70; // 데스크탑 헤더 높이
  const mobileHeaderHeight = 60;  // 모바일 헤더 높이
  const mobileNavHeight = 65;     // 모바일 하단 네비 높이

  // 현재 화면 모드에 따른 네비게이션 높이 계산
  const topNavHeight = isMobile ? mobileHeaderHeight : desktopHeaderHeight;
  const bottomNavHeight = isMobile ? mobileNavHeight : 0; // 데스크탑은 하단 네비 없음

  return (
    <Container
      maxW="container.xl"
      // 상단 패딩: 상단 네비/헤더 높이 + 추가 여백 (20px)
      pt={`${topNavHeight + 20}px`}
      // 하단 패딩: 하단 네비 높이 + 추가 여백 (20px) / 데스크탑은 기본 여백(10px)
      pb={isMobile ? `${bottomNavHeight + 20}px` : 10}
      px={{ base: 3, md: 4 }}
      // 최소 높이: 전체 화면 높이에서 상단 헤더와 하단 네비 높이를 제외
      minHeight={`calc(100vh - ${topNavHeight}px - ${bottomNavHeight}px)`}
    >
      {children}
    </Container>
  );
};

export default Layout;
