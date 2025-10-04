import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProjectChatProps {
  projectId: number;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<{ meetingsAnalyzed?: number; transcriptionsAnalyzed?: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug: log state changes
  useEffect(() => {
    console.log('🔍 ProjectChat state:', { isLoading, hasMessages: messages.length, projectId });
  }, [isLoading, messages, projectId]);

  // Load chat history when project changes
  useEffect(() => {
    if (projectId) {
      loadChatHistory();
    }
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChatHistory = async () => {
    console.log('🔄 Cargando historial del chat del proyecto:', projectId);
    try {
      const response = await fetch(API_ENDPOINTS.PROJECT_CHAT_MESSAGES(projectId));

      if (response.ok) {
        const result = await response.json();
        const history = result.data.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));

        console.log('✅ Historial cargado:', history.length, 'mensajes');

        if (history.length === 0) {
          // Add welcome message if no history
          setMessages([{
            id: '1',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente de IA para todo el proyecto. Tengo acceso a todos los meetings, transcripciones y documentación del proyecto. ¿En qué puedo ayudarte?',
            timestamp: new Date(),
          }]);
        } else {
          setMessages(history);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load project chat history:', error);
      // Show welcome message on error
      setMessages([{
        id: '1',
        role: 'assistant',
        content: '¡Hola! Soy tu asistente de IA para todo el proyecto. Tengo acceso a todos los meetings, transcripciones y documentación del proyecto. ¿En qué puedo ayudarte?',
        timestamp: new Date(),
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) {
      console.log('⚠️ No se puede enviar mensaje:', { input: input.trim(), isLoading });
      return;
    }

    console.log('📤 Enviando mensaje al AI del proyecto...');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const question = input;
    setInput('');
    setIsLoading(true);

    try {
      // Call backend AI service
      const response = await fetch(API_ENDPOINTS.PROJECT_CHAT(projectId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.data.answer,
        timestamp: new Date(),
      };

      // Update stats
      if (result.data.meetingsAnalyzed !== undefined) {
        setStats({
          meetingsAnalyzed: result.data.meetingsAnalyzed,
          transcriptionsAnalyzed: result.data.transcriptionsAnalyzed,
        });
      }

      setMessages(prev => [...prev, aiResponse]);
      console.log('✅ Respuesta del AI recibida');
    } catch (error) {
      console.error('❌ Failed to get AI response:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      console.log('✅ handleSendMessage finalizado, isLoading:', false);
    }
  };

  return (
    <div className="ai-chat project-chat">
      <div className="chat-header">
        <div className="header-title">
          <Bot size={20} />
          <h3>Chat Global del Proyecto</h3>
        </div>
        {stats && (
          <div className="context-info">
            <span className="info-badge">
              {stats.meetingsAnalyzed} meetings analizados
            </span>
            <span className="info-badge">
              {stats.transcriptionsAnalyzed} transcripciones
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
            </div>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={18} />
            </div>
            <div className="message-content">
              <div className="message-text typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Pregunta algo sobre el proyecto..."
          disabled={isLoading}
        />

        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="btn-primary btn-icon"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
