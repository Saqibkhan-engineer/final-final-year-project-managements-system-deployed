import { MessageCircle, GraduationCap, RefreshCw } from "lucide-react";
import React from "react";

export function ChatView({
  groupsLoading,
  groups,
  selectedChatGroupId,
  setSelectedChatGroupId,
  setChatMessages,
  user,
  chatBoxRef,
  chatLoading,
  chatMessages,
  chatInput,
  setChatInput,
  sendChatMessage,
}) {
  return (
    <div className="chat-layout">
      {/* Sidebar - list of groups */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span><MessageCircle className="inline-icon" size={18} /></span>
          <h4>My Groups</h4>
        </div>
        {groupsLoading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
            <RefreshCw className="inline-icon" size={18} /> Loading groups...
          </div>
        ) : groups.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem" }}>
            No groups assigned yet.
          </div>
        ) : (
          groups.map((g) => (
            <div
              key={g.id}
              className={`chat-group-item ${selectedChatGroupId === g.id ? "active" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedChatGroupId(g.id);
                setChatMessages([]);
              }}
            >
              <div
                className="chat-group-avatar"
                style={{
                  fontSize: "1.2rem",
                  background: selectedChatGroupId === g.id ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#e2e8f0",
                }}
              >
                👨‍<GraduationCap className="inline-icon" size={18} />
              </div>
              <div className="chat-group-info">
                <p className="chat-group-name">{g.proposal?.title || g.name || `Group #${g.id}`}</p>
                <p className="chat-group-preview">{g.members?.length || 0} members</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Panel */}
      <div className="chat-panel">
        {!selectedChatGroupId ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "1rem" }}>
            ← Select a group to start chatting
          </div>
        ) : (
          <>
            <div className="chat-panel-header">
              <div className="chat-panel-avatar" style={{ fontSize: "1.2rem", background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                👨‍<GraduationCap className="inline-icon" size={18} />
              </div>
              <div>
                <h4>
                  {groups.find((g) => g.id === selectedChatGroupId)?.proposal?.title ||
                    groups.find((g) => g.id === selectedChatGroupId)?.name ||
                    `Group #${selectedChatGroupId}`}
                </h4>
                <span className="chat-online-dot" />
                <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>Connected · Group #{selectedChatGroupId}</span>
              </div>
            </div>

            <div className="chat-messages-box" ref={chatBoxRef}>
              {chatLoading ? (
                <div className="chat-no-messages"><RefreshCw className="inline-icon" size={18} /> Loading chat...</div>
              ) : chatMessages.length === 0 ? (
                <div className="chat-no-messages">No messages yet. Say hello! </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMine = msg.senderName === (user?.name || "Supervisor");
                  return (
                    <div key={i} className={`chat-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
                      {!isMine && <div className="chat-bubble-name">{msg.senderName}</div>}
                      <div className={`chat-bubble ${isMine ? "bubble-sent" : "bubble-received"}`}>{msg.message}</div>
                      <div className="chat-bubble-time">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
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
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message…"
              />
              <button className="chat-send-button" onClick={sendChatMessage}>
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
