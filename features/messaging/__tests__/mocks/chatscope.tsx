import React from 'react'

export const MainContainer = ({ children, ...props }: any) => (
  <div data-testid="cs-main-container" {...props}>{children}</div>
)

export const ChatContainer = ({ children, ...props }: any) => (
  <div data-testid="cs-chat-container" {...props}>{children}</div>
)

export const MessageList = ({ children, ...props }: any) => (
  <div data-testid="cs-message-list" {...props}>{children}</div>
)

export const Message = ({ model, children, ...props }: any) => (
  <div data-testid="cs-message" data-sender={model?.sender} {...props}>
    {model?.message || children}
  </div>
)

export const MessageInput = ({ onSend, placeholder, ...props }: any) => (
  <div data-testid="cs-message-input">
    <input
      placeholder={placeholder}
      data-testid="cs-message-input-field"
      {...props}
      onChange={() => {}}
    />
    <button
      data-testid="cs-message-input-send"
      onClick={() => onSend && onSend('test message')}
    >
      Send
    </button>
  </div>
)

export const ConversationList = ({ children, ...props }: any) => (
  <div data-testid="cs-conversation-list" {...props}>{children}</div>
)

export const Conversation = ({ name, info, onClick, children, ...props }: any) => (
  <div data-testid="cs-conversation" onClick={onClick} {...props}>
    <span data-testid="cs-conversation-name">{name}</span>
    {info && <span data-testid="cs-conversation-info">{info}</span>}
    {children}
  </div>
)

export const ConversationHeader = ({ children, ...props }: any) => (
  <div data-testid="cs-conversation-header" {...props}>{children}</div>
)

export const Avatar = ({ src, name, ...props }: any) => (
  <div data-testid="cs-avatar" data-name={name} {...props} />
)

export const TypingIndicator = ({ content, ...props }: any) => (
  <div data-testid="cs-typing-indicator" {...props}>{content}</div>
)

export const MessageSeparator = ({ children, ...props }: any) => (
  <div data-testid="cs-message-separator" {...props}>{children}</div>
)
