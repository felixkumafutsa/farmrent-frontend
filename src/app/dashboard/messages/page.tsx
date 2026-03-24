'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { API_URL } from '@/lib/api';


interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Message {
  id: string;
  sender: User;
  receiver: User;
  content: string;
  booking?: {
    id: string;
    equipment: {
      id: string;
      name: string;
    };
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<User | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchMessages();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      const currentUser = userData ? JSON.parse(userData) : null;
      
      console.log('Messages - Token exists:', !!token);
      console.log('Messages - Current user:', currentUser);
      
      if (!token) {
        console.error('No authentication token found for messages');
        setMessages([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch messages:', response.status, response.statusText);
        console.error('Error details:', errorText);
        
        if (response.status === 401) {
          console.error('Authentication failed for messages - token may be expired');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/messages/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchConversation = async (otherUser: User) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/messages/conversation/${otherUser.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversationMessages(data);
        setSelectedConversation(otherUser);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedConversation.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationMessages([...conversationMessages, data]);
        setNewMessage('');
        fetchMessages(); // Refresh all messages
        fetchUnreadCount(); // Refresh unread count
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch(`${API_URL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      fetchUnreadCount(); // Refresh unread count
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getConversationPartners = (): User[] => {
    const partners = new Map<string, User>();
    
    messages.forEach(message => {
      if (message.sender.id !== user?.id) {
        partners.set(message.sender.id, message.sender);
      }
      if (message.receiver.id !== user?.id) {
        partners.set(message.receiver.id, message.receiver);
      }
    });
    
    return Array.from(partners.values());
  };

  const getLastMessage = (partner: User): Message | null => {
    const partnerMessages = messages.filter(
      message => (message.sender.id === partner.id && message.receiver.id === user?.id) ||
                 (message.receiver.id === partner.id && message.sender.id === user?.id)
    );
    
    return partnerMessages.length > 0 ? partnerMessages[0] : null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <Link href="/login" className="text-green-600 hover:text-green-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const conversationPartners = getConversationPartners();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              
              <div className="flex h-96">
                {/* Conversations List */}
                <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
                  {conversationPartners.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">Start a conversation by booking equipment!</p>
                    </div>
                  ) : (
                    conversationPartners.map(partner => {
                      const lastMessage = getLastMessage(partner);
                      const isUnread = lastMessage && !lastMessage.isRead && lastMessage.receiver.id === user.id;
                      
                      return (
                        <div
                          key={partner.id}
                          onClick={() => fetchConversation(partner)}
                          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                            selectedConversation?.id === partner.id ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {partner.firstName.charAt(0)}{partner.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {partner.firstName} {partner.lastName}
                                </p>
                                {lastMessage && (
                                  <span className="text-xs text-gray-500">
                                    {formatDate(lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-gray-500 truncate">
                                  {lastMessage ? lastMessage.content : 'No messages yet'}
                                </p>
                                {isUnread && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Conversation View */}
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Conversation Header */}
                      <div className="border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {selectedConversation.firstName.charAt(0)}{selectedConversation.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {selectedConversation.firstName} {selectedConversation.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{selectedConversation.role}</p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-6">
                        {conversationMessages.length === 0 ? (
                          <div className="text-center text-gray-500">
                            <p>No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          conversationMessages.map(message => (
                            <div
                              key={message.id}
                              className={`mb-4 ${message.sender.id === user.id ? 'text-right' : 'text-left'}`}
                            >
                              <div
                                className={`inline-block max-w-xs px-4 py-2 rounded-lg ${
                                  message.sender.id === user.id
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                {message.booking && (
                                  <p className="text-xs mt-1 opacity-75">
                                    Regarding: {message.booking.equipment.name}
                                  </p>
                                )}
                                <p className="text-xs mt-1 opacity-75">
                                  {formatDate(message.createdAt)}
                                </p>
                              </div>
                              {!message.isRead && message.receiver.id === user.id && (
                                <button
                                  onClick={() => markAsRead(message.id)}
                                  className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Mark as read
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <button
                            onClick={sendMessage}
                            className="ml-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <p>Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
