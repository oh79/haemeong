import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import Signup from './components/Auth/Signup'
import Login from './components/Auth/Login'
import DreamInterpreter from './components/Dream/DreamInterpreter'
import Profile from './components/Profile/Profile'
import Board from './components/Post/Board'
import PostWrite from './components/Post/PostWrite'
import PostDetail from './components/Post/PostDetail'
import PostEdit from './components/Post/PostEdit'
import MyScraps from './components/Profile/MyScraps'
import MyDreams from './components/Profile/MyDreams'
import DreamDetail from './components/Dream/DreamDetail'
import Home from './components/Home'
import axios from 'axios'
import Navbar from './components/Common/Navbar'
import './App.css'
import { Box } from '@chakra-ui/react'
import Layout from './components/Common/Layout'
import VerifyPassword from './components/Profile/VerifyPassword'
import EditProfile from './components/Profile/EditProfile'

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
      <Navbar />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/interpret" element={<ProtectedRoute><DreamInterpreter /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/board" element={<ProtectedRoute><Board /></ProtectedRoute>} />
          <Route path="/board/write" element={<ProtectedRoute><PostWrite /></ProtectedRoute>} />
          <Route path="/board/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/board/edit/:postId" element={<ProtectedRoute><PostEdit /></ProtectedRoute>} />
          <Route path="/my-scraps" element={<ProtectedRoute><MyScraps /></ProtectedRoute>} />
          <Route path="/my-dreams" element={<ProtectedRoute><MyDreams /></ProtectedRoute>} />
          <Route path="/dreams/:id" element={<ProtectedRoute><DreamDetail /></ProtectedRoute>} />
          <Route path="/verify-password" element={<ProtectedRoute><VerifyPassword /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App
