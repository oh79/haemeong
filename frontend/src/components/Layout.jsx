import React from 'react';
import { Container } from '@chakra-ui/react';

const Layout = ({ children }) => {
  return (
    // container.xl (1280px)을 최대 너비로 설정하고, 반응형 패딩 적용
    // pt는 네비게이션 높이(60px) + 약간의 여유(20px)를 고려하여 80px 정도로 설정
    <Container maxW="container.xl" pt="80px" pb={{ base: 6, md: 10 }} px={{ base: 3, md: 4 }}>
      {children}
    </Container>
  );
};

export default Layout;
