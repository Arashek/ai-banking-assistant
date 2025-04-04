import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Voice from 'react-native-voice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value[0]) {
        handleCommand(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (error) {
      console.error('Error stopping voice recording:', error);
    }
  };

  const handleCommand = async (command: string) => {
    try {
      // Add user message to chat
      const userMessage: Message = {
        id: Date.now().toString(),
        text: command,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send command to backend
      const response = await api.post('/ai/process-command', {
        command,
        userId: user?.id,
      });

      // Add AI response to chat
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Clear input
      setInputText('');
    } catch (error) {
      console.error('Error processing command:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error processing your request.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

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
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => inputText.trim() && handleCommand(inputText.trim())}
        >
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.recording]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Icon name="mic" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2C3E50',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#34495E',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recording: {
    backgroundColor: '#E74C3C',
  },
});

export default ChatScreen;
