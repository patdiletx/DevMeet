import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Send, Bot, User, Paperclip, FileText, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ContextDocument {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface AIChatProps {
  userNotes?: string;
}

export function AIChat({ userNotes = '' }: AIChatProps = {}) {
  const { transcriptions, activeMeetingId } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de IA. Puedo ayudarte a analizar la reunión, responder preguntas sobre lo discutido, o consultar documentos que hayas cargado. ¿En qué puedo ayudarte?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextDocuments, setContextDocuments] = useState<ContextDocument[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !activeMeetingId) return;

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
      // Build context from documents and user notes
      let contextParts: string[] = [];

      if (contextDocuments.length > 0) {
        contextParts.push(`Documentos: ${contextDocuments.map(d => d.name).join(', ')}`);
      }

      if (userNotes && userNotes.trim()) {
        contextParts.push(`Apuntes del usuario:\n${userNotes}`);
      }

      const context = contextParts.length > 0 ? contextParts.join('\n\n') : undefined;

      // Call backend AI service
      const response = await fetch(`http://localhost:3000/api/v1/ai/chat/${activeMeetingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
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

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to get AI response:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('resumen') || lowerQuestion.includes('resume')) {
      return 'Basándome en las transcripciones, la reunión trata principalmente sobre análisis de productos en el mercado. Se discutieron características, precios y posicionamiento competitivo de diferentes marcas.';
    }

    if (lowerQuestion.includes('decisión') || lowerQuestion.includes('decision')) {
      return 'Las principales decisiones tomadas fueron: 1) Proceder con un análisis de mercado más detallado, 2) Programar una reunión de seguimiento para la próxima semana.';
    }

    if (lowerQuestion.includes('acción') || lowerQuestion.includes('tarea')) {
      return 'Las tareas pendientes identificadas son: investigar más sobre los productos mencionados, preparar un análisis comparativo de precios, y contactar con proveedores.';
    }

    if (lowerQuestion.includes('quien') || lowerQuestion.includes('quién') || lowerQuestion.includes('participante')) {
      return 'Según las transcripciones, han participado varios speakers en la reunión. Puedo identificar sus contribuciones específicas si me das más detalles sobre qué información necesitas.';
    }

    return `Entiendo tu pregunta sobre "${question}". Basándome en las ${transcriptions.length} transcripciones disponibles y ${contextDocuments.length} documentos de contexto, puedo ayudarte con información específica. ¿Podrías ser más específico sobre qué aspecto te interesa?`;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocs: ContextDocument[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setContextDocuments(prev => [...prev, ...newDocs]);

    // TODO: Upload files to backend
    console.log('Uploading files:', newDocs);

    // Add confirmation message
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `He cargado ${newDocs.length} documento(s) como contexto: ${newDocs.map(d => d.name).join(', ')}. Ahora puedo responder preguntas basándome en este contenido.`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, confirmMessage]);
  };

  const removeDocument = (docId: string) => {
    setContextDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="ai-chat">
      <div className="chat-header">
        <div className="header-title">
          <Bot size={20} />
          <h3>Asistente IA</h3>
        </div>
        <div className="context-info">
          <span className="info-badge">
            {transcriptions.length} transcripciones
          </span>
          {contextDocuments.length > 0 && (
            <span className="info-badge">
              {contextDocuments.length} documentos
            </span>
          )}
          {userNotes && userNotes.trim() && (
            <span className="info-badge info-badge-notes">
              📌 Apuntes incluidos
            </span>
          )}
        </div>
      </div>

      {/* Context Documents */}
      {contextDocuments.length > 0 && (
        <div className="context-documents">
          <h4>
            <FileText size={16} />
            Documentos de Contexto
          </h4>
          <div className="documents-list">
            {contextDocuments.map(doc => (
              <div key={doc.id} className="document-item">
                <FileText size={14} />
                <div className="document-info">
                  <span className="document-name">{doc.name}</span>
                  <span className="document-size">{formatFileSize(doc.size)}</span>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="btn-icon btn-sm"
                  title="Remover documento"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-icon"
          title="Cargar documentos"
        >
          <Paperclip size={20} />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Pregunta algo sobre la reunión..."
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
