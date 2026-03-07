const express = require('express');
const router = express.Router();
const Support = require('../models/Support');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');

// @desc    Registrar como suporte
// @route   POST /api/support/register
router.post('/register', authenticateToken, authorize('ADMIN'), async (req, res) => {
  try {
    const { department, maxConcurrentChats } = req.body;
    
    const existingSupport = await Support.findOne({ user: req.userId });
    if (existingSupport) {
      return res.status(400).json({ error: 'Usuário já é suporte' });
    }
    
    // Atualizar role do usuário
    await User.findByIdAndUpdate(req.userId, { role: 'SUPPORT' });
    
    const support = new Support({
      user: req.userId,
      department: department || 'support',
      maxConcurrentChats: maxConcurrentChats || 5
    });
    
    await support.save();
    
    res.status(201).json({ 
      support,
      message: 'Suporte registrado com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao registrar suporte:', error);
    res.status(500).json({ error: 'Erro ao registrar suporte' });
  }
});

// @desc    Buscar suportes disponíveis
// @route   GET /api/support/available
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { department } = req.query;
    
    const supports = await Support.findAvailableSupport(department);
    
    res.json(supports);
  } catch (error) {
    console.error('❌ Erro ao buscar suportes:', error);
    res.status(500).json({ error: 'Erro ao buscar suportes' });
  }
});

// @desc    Solicitar chat com suporte
// @route   POST /api/support/request-chat
router.post('/request-chat', authenticateToken, async (req, res) => {
  try {
    const { department } = req.body;
    
    // Buscar suporte disponível
    const supports = await Support.findAvailableSupport(department);
    
    if (!supports || supports.length === 0) {
      return res.status(404).json({ error: 'Nenhum suporte disponível no momento' });
    }
    
    // Pegar suporte com menos chats atuais
    const support = supports.sort((a, b) => 
      a.currentChats.length - b.currentChats.length
    )[0];
    
    // Criar sala única para este chat
    const room = `support_${req.userId}_${support.user._id}`;
    
    // Adicionar chat ao suporte
    await support.addChat(req.userId, room);
    
    // Criar mensagem de sistema
    const systemMessage = new Message({
      content: `Chat iniciado com suporte ${support.user.name}`,
      sender: support.user._id,
      senderName: 'Sistema',
      senderRole: 'ADMIN',
      room,
      isSupportMessage: true,
      status: 'delivered'
    });
    
    await systemMessage.save();
    
    // Notificar via socket
    const io = req.app.get('io');
    if (io) {
      io.to(room).emit('support-assigned', {
        room,
        support: support.user,
        message: systemMessage
      });
    }
    
    res.json({
      room,
      support: support.user,
      message: 'Chat com suporte iniciado'
    });
  } catch (error) {
    console.error('❌ Erro ao solicitar suporte:', error);
    res.status(500).json({ error: 'Erro ao solicitar suporte' });
  }
});

// @desc    Finalizar chat com suporte
// @route   POST /api/support/end-chat/:room
router.post('/end-chat/:room', authenticateToken, async (req, res) => {
  try {
    const { room } = req.params;
    
    // Extrair IDs da sala
    const [_, userId, supportId] = room.split('_');
    
    if (!userId || !supportId) {
      return res.status(400).json({ error: 'Sala inválida' });
    }
    
    // Encontrar e atualizar suporte
    const support = await Support.findOne({ user: supportId });
    if (support) {
      await support.endChat(userId);
    }
    
    // Criar mensagem de encerramento
    const endMessage = new Message({
      content: 'Chat encerrado',
      sender: supportId,
      senderName: 'Sistema',
      senderRole: 'ADMIN',
      room,
      isSupportMessage: true,
      status: 'delivered'
    });
    
    await endMessage.save();
    
    // Notificar via socket
    const io = req.app.get('io');
    if (io) {
      io.to(room).emit('chat-ended', { room });
    }
    
    res.json({ message: 'Chat encerrado' });
  } catch (error) {
    console.error('❌ Erro ao encerrar chat:', error);
    res.status(500).json({ error: 'Erro ao encerrar chat' });
  }
});

module.exports = router;