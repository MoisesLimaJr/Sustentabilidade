import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [room, setRoom] = useState('geral');
  const [isTyping, setIsTyping] = useState(false);
  const [supportMode, setSupportMode] = useState(false);
  const [supportRequested, setSupportRequested] = useState(false);
  
  const { 
    socket, 
    onlineUsers, 
    onlineSupports,
    sendMessage: socketSendMessage, 
    joinRoom,
    sendTyping,
    getTypingUsers,
    requestSupport,
    acceptSupportRequest,
    activeSupportChat,
    supportRequests,
    isConnected
  } = useSocket();
  
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automático para o final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Configurar eventos do socket
  useEffect(() => {
    if (!socket) return;

    // Receber nova mensagem
    const handleNewMessage = (msg) => {
      console.log('📨 Nova mensagem recebida:', msg);
      setMessages(prev => [...prev, msg]);
    };

    // Receber histórico
    const handleMessageHistory = (history) => {
      console.log('📜 Histórico recebido:', history.length);
      setMessages(history);
    };

    // Receber confirmação de leitura
    const handleMessageRead = ({ messageId }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
    };

    // Suporte atribuído
    const handleSupportAssigned = ({ room, support, message }) => {
      console.log('🎯 Suporte atribuído:', support);
      setRoom(room);
      setSupportMode(true);
      setMessages(prev => [...prev, message]);
    };

    // Chat encerrado
    const handleChatEnded = () => {
      console.log('🔚 Chat encerrado');
      setSupportMode(false);
      setSupportRequested(false);
      setRoom('geral');
      
      // Mostrar mensagem de sistema
      const systemMsg = {
        _id: `system_${Date.now()}`,
        content: 'Chat com suporte encerrado',
        user: 'Sistema',
        userId: 'system',
        timestamp: new Date(),
        isSystem: true
      };
      setMessages(prev => [...prev, systemMsg]);
    };

    // Registrar listeners
    socket.on('new-message', handleNewMessage);
    socket.on('message-history', handleMessageHistory);
    socket.on('message-read', handleMessageRead);
    socket.on('support-assigned', handleSupportAssigned);
    socket.on('chat-ended', handleChatEnded);

    // Cleanup
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-history', handleMessageHistory);
      socket.off('message-read', handleMessageRead);
      socket.off('support-assigned', handleSupportAssigned);
      socket.off('chat-ended', handleChatEnded);
    };
  }, [socket]);

  // Entrar na sala quando mudar
  useEffect(() => {
    if (room && socket && isConnected) {
      console.log('🚪 Entrando na sala:', room);
      joinRoom(room);
    }
  }, [room, socket, isConnected, joinRoom]);

  // Processar usuários digitando
  const typingUsers = getTypingUsers(room);
  
  // Verificar se é suporte
  const isSupport = user?.role === 'SUPPORT' || user?.role === 'ADMIN';

  // Enviar mensagem
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && socket && isConnected) {
      const messageData = {
        content: input,
        user: user.name,
        userId: user._id
      };
      
      socketSendMessage(room, input);
      setInput('');
      
      // Limpar status de digitação
      if (isTyping) {
        sendTyping(room, false);
        setIsTyping(false);
      }
      
      // Focar no input
      inputRef.current?.focus();
    }
  };

  // Lidar com digitação
  const handleTyping = (e) => {
    setInput(e.target.value);
    
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      sendTyping(room, true);
    }
    
    // Debounce para parar de digitar
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTyping(room, false);
      }
    }, 2000);
  };

  // Solicitar suporte
  const handleRequestSupport = () => {
    if (!supportRequested) {
      requestSupport('general');
      setSupportRequested(true);
      
      // Adicionar mensagem de sistema
      const systemMsg = {
        _id: `system_${Date.now()}`,
        content: 'Solicitação de suporte enviada. Aguarde...',
        user: 'Sistema',
        userId: 'system',
        timestamp: new Date(),
        isSystem: true
      };
      setMessages(prev => [...prev, systemMsg]);
    }
  };

  // Aceitar solicitação de suporte (para suportes)
  const handleAcceptSupport = (request) => {
    const room = acceptSupportRequest(request.id, request.userId);
    if (room) {
      setRoom(room);
      setSupportMode(true);
    }
  };

  // Sair do chat de suporte
  const handleEndSupport = () => {
    if (activeSupportChat) {
      socket?.emit('end-support', {
        room: activeSupportChat.room,
        userId: user._id
      });
    }
  };

  // Formatar timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>
            <i className="fas fa-users"></i> 
            Usuários Online ({onlineUsers.length})
          </h3>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{isConnected ? 'Conectado' : 'Reconectando...'}</span>
          </div>
        </div>
        
        {/* Lista de usuários online */}
        <ul className="online-users">
          {onlineUsers.map(u => (
            <li key={u.userId} className={u.userId === user?._id ? 'current-user' : ''}>
              <span className="user-status online"></span>
              <span className="user-name">{u.name}</span>
              {u.role === 'SUPPORT' && (
                <span className="support-badge">SUP</span>
              )}
              {u.userId === user?._id && <span className="you-badge">você</span>}
            </li>
          ))}
        </ul>

        {/* Suportes online (para usuários comuns) */}
        {!isSupport && onlineSupports.length > 0 && (
          <div className="supports-online">
            <h4>
              <i className="fas fa-headset"></i> 
              Suportes Online ({onlineSupports.length})
            </h4>
            <ul>
              {onlineSupports.map(s => (
                <li key={s.userId}>
                  <span className="support-name">{s.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Solicitações de suporte (para suportes) */}
        {isSupport && supportRequests.length > 0 && (
          <div className="support-requests">
            <h4>
              <i className="fas fa-question-circle"></i>
              Solicitações ({supportRequests.length})
            </h4>
            <ul>
              {supportRequests.map((req, idx) => (
                <li key={idx} className="request-item">
                  <span className="request-user">{req.userName}</span>
                  <button 
                    onClick={() => handleAcceptSupport(req)}
                    className="accept-support-btn"
                  >
                    Atender
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <div className="room-info">
            <h2>
              <i className="fas fa-comments"></i>
              Sala: {room}
            </h2>
            {supportMode && (
              <span className="support-mode-badge">
                <i className="fas fa-headset"></i> Modo Suporte
              </span>
            )}
          </div>
          
          <div className="room-controls">
            <select 
              value={room} 
              onChange={(e) => setRoom(e.target.value)}
              disabled={supportMode}
              className="room-select"
            >
              <option value="geral">🚪 Geral</option>
              <option value="cooperativas">🤝 Cooperativas</option>
              <option value="logistica">🚛 Logística</option>
              {!supportMode && !isSupport && (
                <option value="suporte" disabled={supportRequested}>
                  🆘 Suporte {supportRequested && '(solicitado)'}
                </option>
              )}
            </select>
            
            {!supportMode && !isSupport && !supportRequested && (
              <button 
                onClick={handleRequestSupport}
                className="request-support-btn"
                disabled={!isConnected}
              >
                <i className="fas fa-headset"></i>
                Falar com Suporte
              </button>
            )}
            
            {supportMode && isSupport && (
              <button 
                onClick={handleEndSupport}
                className="end-support-btn"
              >
                <i className="fas fa-times-circle"></i>
                Encerrar Atendimento
              </button>
            )}
          </div>
        </div>

        <div className="messages-container">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="no-messages">
                <i className="fas fa-comment-dots"></i>
                <p>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={msg._id || idx} 
                  className={`message ${msg.userId === user?._id ? 'own' : ''} ${msg.isSystem ? 'system' : ''}`}
                >
                  {!msg.isSystem && (
                    <div className="message-header">
                      <strong className="message-sender">
                        {msg.user || msg.userName || msg.senderName}
                      </strong>
                      {msg.userId !== user?._id && msg.userRole === 'SUPPORT' && (
                        <span className="support-tag">Suporte</span>
                      )}
                    </div>
                  )}
                  
                  <div className="message-content">
                    <p>{msg.content || msg.message}</p>
                  </div>
                  
                  <div className="message-footer">
                    <span className="message-time">
                      {formatTime(msg.timestamp || msg.createdAt)}
                    </span>
                    {msg.userId === user?._id && msg.status && (
                      <span className="message-status">
                        {msg.status === 'read' && <i className="fas fa-check-double read"></i>}
                        {msg.status === 'delivered' && <i className="fas fa-check"></i>}
                        {msg.status === 'sent' && <i className="fas fa-check"></i>}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Indicador de digitação */}
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <span className="typing-dots">
                  {typingUsers.join(', ')} {typingUsers.length > 1 ? 'estão' : 'está'} digitando
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                  <span className="dot">.</span>
                </span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleTyping}
            placeholder={
              !isConnected 
                ? 'Conectando...' 
                : supportMode 
                  ? 'Digite sua mensagem para o suporte...' 
                  : 'Digite sua mensagem...'
            }
            disabled={!isConnected || (supportMode && !activeSupportChat)}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || !isConnected}
            className="send-button"
          >
            <i className="fas fa-paper-plane"></i>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;