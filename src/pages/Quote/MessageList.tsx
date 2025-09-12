import React, { useEffect, useRef } from 'react';
import Message from './Message';

interface MessageListProps {
  messages: any[];
  showOptions?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the newest message whenever messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Organized Tailwind class groups
  const containerClasses = [
    // Layout & Structure
    "h-full overflow-y-auto overflow-x-hidden scroll-smooth",
    // Responsive spacing
    "px-2 sm:px-4 md:px-6",
    "py-2 sm:py-3 md:py-4 lg:py-6",
    "space-y-2 sm:space-y-3 md:space-y-4",
    // Scrollbar styling
    "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
    "hover:scrollbar-thumb-gray-400"
  ].join(" ");

  const bottomSpacerClasses = [
    "h-1 flex-shrink-0"
  ].join(" ");

  return (
    <div 
      ref={containerRef} 
      className={containerClasses}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db transparent'
      }}
    >
      {messages.map(msg => (
        <Message key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} className={bottomSpacerClasses} />
    </div>
  );
};

export default MessageList;