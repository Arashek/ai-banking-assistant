import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { bankingApi } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  action?: {
    type: string;
    params: Record<string, any>;
  };
  timestamp: Date;
}

interface ChatAssistantProps {
  onAction?: (action: { type: string; params: Record<string, any> }) => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onAction }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { t } = useLanguage();
  const { user } = useAuth();

  // Initialize voice recognition
  React.useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value[0]) {
      setInput(e.value[0]);
      handleSubmit(e.value[0]);
    }
  };

  const startListening = async () => {
    try {
      await Voice.start('es-ES');
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const handleSubmit = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await bankingApi.post('/ai/query', {
        input: text,
        context: {
          previousMessages: messages.slice(-5),
        },
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.text,
        sender: 'assistant',
        action: response.data.action,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (response.data.action && onAction) {
        onAction(response.data.action);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t.errors.general,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2C3E50" />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t.bankAccess.assistant.inputPlaceholder}
          placeholderTextColor="#95A5A6"
          multiline
          maxLength={500}
          onSubmitEditing={() => handleSubmit()}
        />

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={isListening ? stopListening : startListening}
        >
          <Icon
            name={isListening ? 'mic' : 'mic-none'}
            size={24}
            color={isListening ? '#E74C3C' : '#2C3E50'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSubmit()}
          disabled={!input.trim() || isLoading}
        >
          <Icon name="send" size={24} color={input.trim() ? '#2C3E50' : '#95A5A6'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messageList: {
    flex: 1,
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: '#2C3E50',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  assistantMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  timestamp: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DFE4EA',
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
    color: '#2C3E50',
  },
  voiceButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatAssistant;
