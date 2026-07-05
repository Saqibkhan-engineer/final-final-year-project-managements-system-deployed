import { MessageCircle, RefreshCw } from "lucide-react";
import React from "react";

export function ChatView({
  chatLoading,
  chatError,
  myGroupInfo,
  myGroupId,
  chatBoxRef,
  chatMessages,
  user,
  chatInput,
  setChatInput,
  sendStudentMessage,
}) {
  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar" style={{ minWidth: '220px', maxWidth: '220px' }}>
        <div className="chat-sidebar-header">
          <span><MessageCircle className="inline-icon" size={18} /></span>
          <h4>My Chat</h4>
        </div>
        {chatLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
            <RefreshCw className="inline-icon" size={18} /> Loading group...
          </div>
        ) : chatError ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '0.8rem' }}>
            {chatError}
          </div>
        ) : (
          <div className="chat-group-item active" style={{ cursor: 'default' }}>
            <div className="chat-group-avatar" style={{ fontSize: '1.2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>👨‍🏫</div>
            <div className="chat-group-info">
              <p className="chat-group-name">{myGroupInfo?.name || myGroupInfo?.proposal?.title || 'FYP Group Chat'}</p>
              <p className="chat-group-preview">Group #{myGroupId}</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      <div className="chat-panel">
        <div className="chat-panel-header">
          <div className="chat-panel-avatar" style={{ fontSize: '1.2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>👨‍🏫</div>
          <div>
            <h4>{myGroupInfo?.name || myGroupInfo?.proposal?.title || 'FYP Group Chat'}</h4>
            {myGroupId && (
              <>
                <span className="chat-online-dot" />
                <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>Connected · Group #{myGroupId}</span>
              </>
            )}
          </div>
        </div>

        <div className="chat-messages-box" ref={chatBoxRef}>
          {chatLoading ? (
            <div className="chat-no-messages"><RefreshCw className="inline-icon" size={18} /> Loading chat...</div>
          ) : chatError ? (
            <div className="chat-no-messages" style={{ color: '#ef4444' }}>{chatError}</div>
          ) : chatMessages.length === 0 ? (
            <div className="chat-no-messages">No messages yet. Say hello! </div>
          ) : (
            chatMessages.map((msg, i) => {
              const isMine = msg.senderName === (user?.name || 'Student');
              return (
                <div key={i} className={`chat-bubble-wrap ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && <div className="chat-bubble-name">{msg.senderName}</div>}
                  <div className={`chat-bubble ${isMine ? 'bubble-sent' : 'bubble-received'}`}>
                    {msg.message}
                  </div>
                  <div className="chat-bubble-time">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="chat-input-area">
          <input
            className="chat-text-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendStudentMessage()}
            placeholder={myGroupId ? "Type a message…" : "Join a group to chat..."}
            disabled={!myGroupId}
          />
          <button className="chat-send-button" onClick={sendStudentMessage} disabled={!myGroupId}>➤</button>
        </div>
      </div>
    </div>
  );
}
