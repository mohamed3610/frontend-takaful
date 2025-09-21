import React from 'react';
import QuoteResult from './QuoteResult';

interface MessageProps {
  message: {
    id: string;
    content: string;
    type: 'user' | 'assistant';
    step?: any;
    quote?: any;
    isQuoteResult?: boolean;
  };
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const renderMessageContent = () => {
    // Handle quote result display using the isQuoteResult flag
    if (message.isQuoteResult && message.quote) {
      return <QuoteResult quote={message.quote} />;
    }

    // Handle case where quote was expected but missing
    if (message.isQuoteResult && !message.quote) {
      console.warn('Quote content expected but quote data missing:', message);
      return <span className="text-red-500">Quote data unavailable</span>;
    }

    // Don't render options in message - they'll be handled by ChatInput
    // Just show the message text
    if (!message.content || message.content.trim() === '') {
      return <span className="text-gray-500">No content available</span>;
    }

    // Handle regular text content with line breaks
    const lines = message.content.split('\n');
    return lines.map((line, index) => (
      <span key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div
      className={`mb-6 ${
        message.type === 'user'
          ? 'flex justify-end'
          : 'flex items-start gap-4'
      } opacity-0 translate-y-5 animate-fadeInUp`}
    >
      {message.type === 'assistant' && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-green-600 flex items-center justify-center text-sm flex-shrink-0">
          🤖
        </div>
      )}
      <div
        className={`${
          message.type === 'assistant'
            ? 'bg-amber-50 rounded-3xl rounded-bl-lg max-w-[80%] p-6 leading-relaxed'
            : 'bg-gradient-to-br from-yellow-500 to-green-600 text-white rounded-3xl rounded-br-lg max-w-[80%] p-6'
        }`}
      >
        {renderMessageContent()}
      </div>
    </div>
  );
};

export default Message;