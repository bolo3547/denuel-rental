/**
 * Firebase Firestore Real-time Chat
 * For property inquiries and messaging
 */

import { getFirebaseFirestore } from './firebase';
import { getFirebaseAdminFirestore } from './firebase-admin';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  updateDoc,
  doc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  read: boolean;
  type: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

export interface Conversation {
  id?: string;
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  tenantId: string;
  lastMessage: string;
  lastMessageTime: any; // Firestore Timestamp
  unreadCount: { [userId: string]: number };
  createdAt: any;
}

/**
 * Create or get conversation between landlord and tenant for a property
 */
export async function createConversation(data: {
  propertyId: string;
  propertyTitle: string;
  landlordId: string;
  tenantId: string;
}): Promise<string | null> {
  const db = getFirebaseFirestore();
  if (!db) {
    console.warn('Firebase Firestore not initialized');
    return null;
  }

  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('propertyId', '==', data.propertyId),
      where('landlordId', '==', data.landlordId),
      where('tenantId', '==', data.tenantId)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create new conversation
    const conversation: Conversation = {
      ...data,
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      unreadCount: {
        [data.landlordId]: 0,
        [data.tenantId]: 0,
      },
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(conversationsRef, conversation);
    return docRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(data: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  message: string;
  type?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}): Promise<string | null> {
  const db = getFirebaseFirestore();
  if (!db) {
    console.warn('Firebase Firestore not initialized');
    return null;
  }

  try {
    const messagesRef = collection(db, 'messages');
    const message: ChatMessage = {
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderPhoto: data.senderPhoto,
      message: data.message,
      timestamp: serverTimestamp(),
      read: false,
      type: data.type || 'text',
      attachmentUrl: data.attachmentUrl,
    };

    const docRef = await addDoc(messagesRef, message);

    // Update conversation's last message
    const conversationRef = doc(db, 'conversations', data.conversationId);
    await updateDoc(conversationRef, {
      lastMessage: data.message,
      lastMessageTime: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

/**
 * Subscribe to messages in a conversation (real-time)
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void,
  messageLimit: number = 50
): () => void {
  const db = getFirebaseFirestore();
  if (!db) {
    console.warn('Firebase Firestore not initialized');
    return () => {};
  }

  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'desc'),
    limit(messageLimit)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      // Reverse to show oldest first
      callback(messages.reverse());
    },
    (error) => {
      console.error('Error subscribing to messages:', error);
    }
  );

  return unsubscribe;
}

/**
 * Subscribe to user's conversations (real-time)
 */
export function subscribeToUserConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db) {
    console.warn('Firebase Firestore not initialized');
    return () => {};
  }

  const conversationsRef = collection(db, 'conversations');
  
  // Query conversations where user is either landlord or tenant
  const q1 = query(
    conversationsRef,
    where('landlordId', '==', userId),
    orderBy('lastMessageTime', 'desc')
  );

  const q2 = query(
    conversationsRef,
    where('tenantId', '==', userId),
    orderBy('lastMessageTime', 'desc')
  );

  let conversations: Conversation[] = [];
  let unsubscribe1: () => void;
  let unsubscribe2: () => void;

  // Subscribe to landlord conversations
  unsubscribe1 = onSnapshot(q1, (snapshot) => {
    const landlordConvs: Conversation[] = [];
    snapshot.forEach((doc) => {
      landlordConvs.push({ id: doc.id, ...doc.data() } as Conversation);
    });
    
    // Merge and deduplicate
    conversations = [...landlordConvs];
    callback(conversations);
  });

  // Subscribe to tenant conversations
  unsubscribe2 = onSnapshot(q2, (snapshot) => {
    const tenantConvs: Conversation[] = [];
    snapshot.forEach((doc) => {
      tenantConvs.push({ id: doc.id, ...doc.data() } as Conversation);
    });
    
    // Merge and deduplicate
    const convMap = new Map(conversations.map(c => [c.id, c]));
    tenantConvs.forEach(c => convMap.set(c.id!, c));
    conversations = Array.from(convMap.values());
    
    callback(conversations);
  });

  // Return combined unsubscribe function
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) {
    console.warn('Firebase Firestore not initialized');
    return false;
  }

  try {
    // Get unread messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      where('read', '==', false),
      where('senderId', '!=', userId)
    );

    const snapshot = await getDocs(q);
    
    // Update each message
    const updates = snapshot.docs.map((docSnapshot) => {
      return updateDoc(doc(db, 'messages', docSnapshot.id), { read: true });
    });

    await Promise.all(updates);

    // Update unread count in conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });

    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
}

/**
 * Get conversation by ID (server-side)
 */
export async function getConversationById(
  conversationId: string
): Promise<Conversation | null> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    console.warn('Firebase Admin Firestore not initialized');
    return null;
  }

  try {
    const docRef = db.collection('conversations').doc(conversationId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return null;
    }

    return { id: docSnapshot.id, ...docSnapshot.data() } as Conversation;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
}

/**
 * Delete conversation and all messages (server-side)
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  const db = getFirebaseAdminFirestore();
  if (!db) {
    console.warn('Firebase Admin Firestore not initialized');
    return false;
  }

  try {
    // Delete all messages in conversation
    const messagesSnapshot = await db
      .collection('messages')
      .where('conversationId', '==', conversationId)
      .get();

    const batch = db.batch();
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete conversation
    const conversationRef = db.collection('conversations').doc(conversationId);
    batch.delete(conversationRef);

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
}
