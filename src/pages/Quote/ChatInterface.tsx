import React from 'react';
import ProgressIndicator from './ProgressIndicator';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

interface ChatInterfaceProps {
  messages: any[];
  conversationStep: number;
  userData: any;
  awaitingUser: boolean;
  showTyping: boolean;
  onUserResponse: (value: any, step: any) => void;
  onFinalAction: (action: string) => void;
  progressTexts: string[];
  conversationFlow: any[];
  showFinalOptions?: boolean;
  canSendMessage?: boolean;
  validationErrors?: string[];
  onGoBack?: (stepIndex: number) => void;
  stepHistory?: number[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  conversationStep,
  userData,
  awaitingUser,
  showTyping,
  onUserResponse,
  onFinalAction,
  progressTexts,
  conversationFlow,
  showFinalOptions = false,
  canSendMessage = true,
  validationErrors = [],
  onGoBack,
  stepHistory = []
}) => {
  // Get current step from flow
  const currentStep = conversationFlow[conversationStep];
  
  // Get the last assistant message to check if it has step info with options
  const lastAssistantMessage = messages.slice().reverse().find(msg => msg.type === 'assistant');
  const messageStep = lastAssistantMessage?.step;
  
  // Debug logging
  console.log('ChatInterface Debug:', {
    lastAssistantMessage: lastAssistantMessage?.content,
    messageStep: messageStep,
    hasOptions: messageStep?.options?.length > 0,
    awaitingUser,
    showFinalOptions
  });
  
  // Use messageStep if it has options and we're awaiting user, otherwise use currentStep
  const stepForInput = (messageStep?.options && awaitingUser) ? messageStep : currentStep;

  // Create wrapper functions that match the expected signatures
  const handleUserInput = (value: { text: string; sender: "user"; }) => {
    if (!canSendMessage) return;
    onUserResponse(value, stepForInput);
  };

  const handleOptionSelect = (selection: { text: string; value: string; }) => {
    if (!canSendMessage) return;
    onUserResponse(selection, stepForInput);
  };

  return (
    <div className="relative flex flex-col h-[70vh] max-h-[70vh] overflow-hidden rounded-[25px] shadow-lg bg-[var(--cream)] takaful-quote">
      <div className="absolute top-0 left-0 right-0 h-[5px] bg-[linear-gradient(90deg,var(--gold),var(--emerald),var(--mint))]" />
      
      <ProgressIndicator currentStep={conversationStep} progressTexts={progressTexts} />
      
      <ChatHeader showTyping={showTyping} />
      
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mx-4 mb-2">
          <div className="text-sm text-red-700">
            <strong>Please fix the following issues:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-100 bg-white p-4">
        {/* Show ChatInput for all awaiting user scenarios */}
        {awaitingUser && (
          <ChatInput
            inputType={
              showFinalOptions ? 'options' :
              stepForInput?.type === 'loading' ? 'loading' :
              stepForInput?.options ? 'options' : 'input'
            }
            currentStep={stepForInput}
            showFinalOptions={showFinalOptions}
            onUserInput={handleUserInput}
            onOptionSelect={handleOptionSelect}
            onFinalAction={onFinalAction}
            userData={userData}
            conversationStep={conversationStep}
            stepHistory={stepHistory}
            onGoBack={onGoBack}
            conversationFlow={conversationFlow}
          />
        )}
        
        {/* Loading state indicator */}
        {!awaitingUser && !showFinalOptions && (
          <div className="flex items-center justify-center py-4">
            <div className="text-gray-500 text-sm">Processing...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;