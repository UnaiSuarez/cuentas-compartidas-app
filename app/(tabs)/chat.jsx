import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Send, MessageCircle } from 'lucide-react-native'
import { useApp }  from '../../src/context/AppContext'
import { useChat } from '../../src/hooks/useChat'
import { formatDate } from '../../src/utils/formatters'

export default function ChatScreen() {
  const { messages, userProfile, groupMembers, loading } = useApp()
  const { sendMessage, markAsRead, sending } = useChat()
  const insets  = useSafeAreaInsets()
  const [text, setText] = useState('')
  const flatRef = useRef(null)

  const chronological = [...messages].reverse()

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.sender !== userProfile?.id && !msg.readBy?.includes(userProfile?.id)) {
        markAsRead(msg.id)
      }
    })
  }, [messages.length])

  async function handleSend() {
    if (!text.trim()) return
    const textToSend = text
    setText('')
    await sendMessage(textToSend)
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
  }

  const getMember = id => groupMembers.find(m => m.id === id)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  // En Android con edgeToEdgeEnabled el KeyboardAvoidingView necesita
  // un offset igual a la barra de tabs para no quedar tapado.
  const TAB_BAR_HEIGHT = 60 + insets.bottom
  const kvOffset = Platform.OS === 'android' ? TAB_BAR_HEIGHT : 0

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
        keyboardVerticalOffset={kvOffset}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-slate-800">
          <Text className="text-white font-bold text-lg">Chat del grupo</Text>
        </View>

        {/* Mensajes */}
        <FlatList
          ref={flatRef}
          data={chronological}
          keyExtractor={item => item.id}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="items-center py-16">
              <MessageCircle size={40} color="#334155" />
              <Text className="text-slate-400 text-center mt-3">Aún no hay mensajes.</Text>
              <Text className="text-slate-600 text-sm text-center mt-1">¡Sé el primero en escribir!</Text>
            </View>
          }
          renderItem={({ item: msg }) => {
            const isOwn    = msg.sender === userProfile?.id
            const isSystem = msg.type === 'system' || msg.type === 'payment_reminder'

            if (isSystem) {
              return (
                <View className="flex justify-center items-center my-1">
                  <Text className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full text-center">
                    {msg.text}
                  </Text>
                </View>
              )
            }

            return (
              <View className={`mb-3 max-w-xs ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
                {!isOwn && (
                  <Text className="text-slate-400 text-xs mb-1 ml-1">
                    {msg.senderName || 'Desconocido'}
                  </Text>
                )}
                <View className={`px-4 py-2.5 rounded-2xl ${
                  isOwn ? 'bg-blue-600 rounded-tr-sm' : 'bg-slate-700 rounded-tl-sm'
                }`}>
                  <Text className="text-white text-sm leading-5">{msg.text}</Text>
                </View>
                <Text className={`text-slate-500 text-xs mt-1 mx-1 ${isOwn ? 'text-right' : ''}`}>
                  {msg.createdAt?.toDate
                    ? formatDate(msg.createdAt.toDate(), true)
                    : '—'}
                </Text>
              </View>
            )
          }}
        />

        {/* Input */}
        <View className="flex-row items-end px-4 py-3 gap-3 border-t border-slate-800">
          <TextInput
            className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3 border border-slate-700"
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#64748b"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            style={{ maxHeight: 120 }}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              text.trim() ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
