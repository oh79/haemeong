import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import Signup from './components/Signup'
import Login from './components/Login'
import DreamInterpreter from './components/DreamInterpreter'
import Profile from './components/Profile'
import Board from './components/Board'
import PostWrite from './components/PostWrite'
import PostDetail from './components/PostDetail'
import PostEdit from './components/PostEdit'
import MyScraps from './components/MyScraps'
import MyDreams from './components/MyDreams'
import DreamDetail from './components/DreamDetail'
import Home from './components/Home'
import axios from 'axios'
import './App.css'
import {
  Box, Flex, Heading, Spacer, Button, HStack, Link as ChakraLink,
  IconButton, useDisclosure, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, VStack
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import Layout from './components/Layout'

function Navigation() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const storedUserInfo = localStorage.getItem('userInfo')
    if (token) {
      setIsLoggedIn(true)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      if (storedUserInfo) {
        setUserInfo(JSON.parse(storedUserInfo))
      }
    } else {
      setIsLoggedIn(false)
      setUserInfo(null)
      delete axios.defaults.headers.common['Authorization']
    }
    const handleRouteChange = () => onClose();
  }, [navigate, onClose])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    delete axios.defaults.headers.common['Authorization']
    setIsLoggedIn(false)
    setUserInfo(null)
    onClose()
    navigate('/')
  }

  const handleLinkClick = (path) => {
    navigate(path);
    onClose();
  }

  return (
    <>
      <Box
        as="nav"
        bg="white"
        px={{ base: 4, md: 6 }}
        boxShadow="sm"
        position="sticky"
        top={0}
        zIndex="sticky"
        width="100%"
        h="60px"
      >
        <Flex maxW="container.xl" mx="auto" align="center" h="100%">
          <Heading size="md" color="teal.600" _hover={{ color: 'teal.700' }} transition="color 0.2s">
            <ChakraLink onClick={() => handleLinkClick('/')} _hover={{ textDecoration: 'none' }}>
              나의 꿈 해몽 서비스
            </ChakraLink>
          </Heading>

          <Spacer />

          <HStack spacing={4} align="center" display={{ base: 'none', md: 'flex' }}>
            <ChakraLink as={Link} to="/board" color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>게시판</ChakraLink>
            {isLoggedIn ? (
              <>
                <ChakraLink as={Link} to="/my-dreams" color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>내 해몽</ChakraLink>
                <ChakraLink as={Link} to="/my-scraps" color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>내 스크랩</ChakraLink>
                <ChakraLink as={Link} to="/profile" color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>내 정보</ChakraLink>
                <Button onClick={handleLogout} colorScheme="teal" variant="outline" size="sm">
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" colorScheme="teal" variant="ghost" size="sm">
                  로그인
                </Button>
                <Button as={Link} to="/signup" colorScheme="teal" variant="solid" size="sm">
                  회원가입
                </Button>
              </>
            )}
          </HStack>

          <IconButton
            aria-label="메뉴 열기"
            icon={<HamburgerIcon />}
            size="md"
            display={{ base: 'flex', md: 'none' }}
            onClick={onOpen}
            variant="ghost"
            colorScheme="teal"
          />
        </Flex>
      </Box>

      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">메뉴</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4} mt={4}>
              <ChakraLink onClick={() => handleLinkClick('/board')} color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>게시판</ChakraLink>
              {isLoggedIn ? (
                <>
                  <ChakraLink onClick={() => handleLinkClick('/my-dreams')} color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>내 해몽</ChakraLink>
                  <ChakraLink onClick={() => handleLinkClick('/my-scraps')} color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>내 스크랩</ChakraLink>
                  <ChakraLink onClick={() => handleLinkClick('/profile')} color="gray.600" _hover={{ color: 'teal.600', textDecoration: 'underline' }}>내 정보</ChakraLink>
                  <Button onClick={handleLogout} colorScheme="teal" variant="outline" size="sm" w="full">
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => handleLinkClick('/login')} colorScheme="teal" variant="ghost" size="sm" w="full">
                    로그인
                  </Button>
                  <Button onClick={() => handleLinkClick('/signup')} colorScheme="teal" variant="solid" size="sm" w="full">
                    회원가입
                  </Button>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

const isAuthenticated = () => {
  return !!localStorage.getItem('authToken')
}

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Box>
      <Navigation />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/board/write" element={<ProtectedRoute><PostWrite /></ProtectedRoute>} />
          <Route path="/board/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/board/edit/:postId" element={<ProtectedRoute><PostEdit /></ProtectedRoute>} />
          <Route path="/my-scraps" element={<ProtectedRoute><MyScraps /></ProtectedRoute>} />
          <Route path="/my-dreams" element={<ProtectedRoute><MyDreams /></ProtectedRoute>} />
          <Route path="/dreams/:id" element={<ProtectedRoute><DreamDetail /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App
