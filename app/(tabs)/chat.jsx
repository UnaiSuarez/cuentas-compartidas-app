import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Send } from 'lucide-react-native'
import {
  addDoc, collection, serverTimestamp,
} from 'firebase/firestore'
import { db }         from '../../src/config/firebase'
import { useApp }     from '../../src/context/AppContext'
import { timeAgo }    from '../../src/utils/formatters'

export default function ChatScreen() {
  const { userProfile, groupId, messages, loading } = useApp()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const flatRef = useRef(null)

  // messages llegan en orden desc desde Firestore; los revertimos para chat
  const sorted = [...messages]
    .filter(m => m.type === 'message')
    .reverse()

  async function sendMessage() {
    if (!text.trim() || !groupId || !userProfile) return
    const content = text.trim()
    setText('')
    setSending(true)
    try {
      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        type:        'message',
        text:        content,
        sender:      userProfile.id,
        senderName:  userProfile.name,
        senderAvatar: userProfile.avatar,
        readBy:      [userProfile.id],
        createdAt:   serverTimestamp(),
      })
    } catch (_) {
      setText(content)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-slate-800">
          <Text className="text-white font-bold text-lg">Chat del grupo</Text>
        </View>

        {/* Mensajes */}
        <FlatList
          ref={flatRef}
          data={sorted}
          keyExtractor={item => item.id}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-4xl mb-3">💬</Text>
              <Text className="text-slate-400 text-center">Sin mensajes todavía.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender === userProfile?.id
            return (
              <View className={`mb-3 max-w-xs ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                {!isMe && (
                  <Text className="text-slate-400 text-xs mb-1 ml-1">{item.senderName}</Text>
                )}
                <View className={`px-4 py-2.5 rounded-2xl ${
                  isMe ? 'bg-blue-600 rounded-tr-sm' : 'bg-slate-700 rounded-tl-sm'
                }`}>
                  <Text className="text-white text-sm leading-5">{item.text}</Text>
                </View>
                <Text className="text-slate-500 text-xs mt-1 mx-1">{timeAgo(item.createdAt)}</Text>
              </View>
            )
          }}
        />

        {/* Input */}
        <View className="flex-row items-end px-4 py-3 gap-3 border-t border-slate-800">
          <TextInput
            className="flex-1 bg-slate-800 text-white rounded-2xl px-4 py-3 border border-slate-700"
            placeholder="Escribe un mensaje…"
            placeholderTextColor="#64748b"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            style={{ maxHeight: 120 }}
          />
          <TouchableOpacity
            onPress={sendMessage}
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
