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
import axios from 'axios'
import './App.css'
import { Box, Flex, Heading, Spacer, Button, HStack, Link as ChakraLink, Container, VStack, Text } from '@chakra-ui/react'

function Home() {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'))
  const isLoggedIn = !!localStorage.getItem('authToken')

  return (
    <Container maxW="container.md" centerContent py={10}>
      <VStack spacing={6} textAlign="center">
        <Heading as="h1" size="2xl" color="teal.600">
          당신의 꿈을 해석해 보세요
        </Heading>
        {isLoggedIn && userInfo ? (
           <Text fontSize="lg" color="gray.600">
             안녕하세요, <Text as="span" fontWeight="bold">{userInfo.username}</Text>님! 어떤 꿈을 꾸셨나요?
           </Text>
        ) : (
           <Text fontSize="lg" color="gray.500">
             로그인하고 꿈 해몽 서비스를 이용해보세요.
           </Text>
        )}
      </VStack>

      {isLoggedIn && (
        <Box width="100%" mt={10} p={6} borderWidth={1} borderRadius="lg" boxShadow="md">
          <DreamInterpreter />
        </Box>
      )}
      
      {!isLoggedIn && (
          <Button as={Link} to="/login" colorScheme="teal" size="lg" mt={10}>
             로그인하고 시작하기
          </Button>
       )}
    </Container>
  )
}

function Navigation() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

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
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    delete axios.defaults.headers.common['Authorization']
    setIsLoggedIn(false)
    setUserInfo(null)
    navigate('/')
  }

  return (
    <Box
      as="nav"
      bg="white"
      px={6}
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex="sticky"
      width="100%"
      h="60px"
    >
      <Flex maxW="container.xl" mx="auto" align="center" h="100%">
        <Heading size="md" color="teal.600" _hover={{ color: 'teal.700' }} transition="color 0.2s">
          <ChakraLink as={Link} to="/" _hover={{ textDecoration: 'none' }}>
            나의 꿈 해몽
          </ChakraLink>
        </Heading>

        <Spacer />

        <HStack spacing={4} align="center">
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
      </Flex>
    </Box>
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
      <Box pt="60px" pb={10} px={4}>
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
      </Box>
    </Box>
  )
}

export default App
