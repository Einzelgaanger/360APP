import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, X, Loader2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage, InsightSuggestion } from '@/types/appraisal';
import { cn } from '@/lib/utils';

const INSIGHT_SUGGESTIONS: InsightSuggestion[] = [
  { id: '1', question: 'Who are the top 3 performing managers?', category: 'performance' },
  { id: '2', question: 'Which manager has the best team leadership score?', category: 'leadership' },
  { id: '3', question: 'What are the most common improvement areas?', category: 'feedback' },
  { id: '4', question: 'Compare Demola Idowu vs Dotun Adekunle', category: 'comparison' },
  { id: '5', question: 'Which managers need cultural fit improvement?', category: 'culture' },
  { id: '6', question: 'What should managers stop doing most?', category: 'feedback' },
  { id: '7', question: 'Who received the most reviews?', category: 'performance' },
  { id: '8', question: 'Average score by relationship type?', category: 'comparison' },
];

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dataContext: string;
}

// Keep markdown formatting for rich display
const formatResponse = (text: string): string => {
  return text
    // Clean up excessive newlines only
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export default function AIChatPanel({ isOpen, onClose, dataContext }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState<number[]>([0, 1, 2]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Rotate suggestions with animation
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleSuggestions(prev => {
        const next = prev.map(i => (i + 1) % INSIGHT_SUGGESTIONS.length);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          dataContext,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessage.id ? { ...m, content: formatResponse(assistantContent) } : m
                ));
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics Copilot</h3>
                <p className="text-xs text-muted-foreground">Ask anything about the data</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Animated Suggestions - Always visible when no messages */}
          {messages.length === 0 && (
            <div className="p-6 flex-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h4 className="text-lg font-medium mb-2">What would you like to know?</h4>
                <p className="text-sm text-muted-foreground">Ask questions about manager performance, feedback trends, or comparisons</p>
              </motion.div>

              {/* Floating Animated Suggestions - Carousel Style */}
              <div className="w-full relative overflow-hidden">
                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    {visibleSuggestions.map((suggestionIdx, i) => {
                      const suggestion = INSIGHT_SUGGESTIONS[suggestionIdx];
                      return (
                        <motion.button
                          key={`suggestion-${suggestionIdx}-${i}`}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            transition: { 
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                              delay: i * 0.08 
                            }
                          }}
                          exit={{ 
                            opacity: 0, 
                            y: -20, 
                            scale: 0.95,
                            transition: { duration: 0.2 }
                          }}
                          whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => sendMessage(suggestion.question)}
                          className="w-full p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-left hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div 
                              className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0"
                              whileHover={{ rotate: [0, -5, 5, 0] }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="text-xs font-bold text-primary uppercase">
                                {suggestion.category.slice(0, 2)}
                              </span>
                            </motion.div>
                            <span className="text-sm font-medium">{suggestion.question}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 mt-6">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {visibleSuggestions[0] + 1}/{INSIGHT_SUGGESTIONS.length}
                </span>
              </div>
            </div>
          )}

          {/* Messages - Only show when there are messages */}
          {messages.length > 0 && (
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('chat-bubble', msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai')}
                >
                  {msg.role === 'assistant' ? (
                    <div 
                      className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none
                        prose-strong:text-primary prose-strong:font-semibold
                        prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2
                        prose-p:my-2 prose-ul:my-2 prose-ol:my-2
                        prose-li:my-0.5"
                      dangerouslySetInnerHTML={{ 
                        __html: msg.content
                          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                          .replace(/^### (.+)$/gm, '<h4>$1</h4>')
                          .replace(/^## (.+)$/gm, '<h3>$1</h3>')
                          .replace(/^# (.+)$/gm, '<h2>$1</h2>')
                          .replace(/^\d+\.\s+(.+)$/gm, '<li class="list-decimal ml-4">$1</li>')
                          .replace(/^[•\-]\s+(.+)$/gm, '<li class="list-disc ml-4">$1</li>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </motion.div>
              ))}
              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="chat-bubble chat-bubble-ai flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the appraisal data..."
                className="flex-1"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}