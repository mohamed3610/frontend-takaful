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

  // Tailwind class groups for organization
  const containerClasses = [
    // Layout & Structure
    "relative flex flex-col w-full overflow-hidden",
    // Height - responsive
    "h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)]",
    "min-h-[500px] max-h-[900px]",
    // Styling
    "rounded-lg sm:rounded-xl lg:rounded-[25px] shadow-lg bg-[var(--cream)]",
    // Animation
    "transition-all duration-300 ease-in-out",
    // Custom class
    "takaful-quote"
  ].join(" ");

  const gradientLineClasses = [
    "absolute top-0 left-0 right-0",
    "h-[3px] sm:h-[4px] lg:h-[5px]",
    "bg-[linear-gradient(90deg,var(--gold),var(--emerald),var(--mint))]"
  ].join(" ");

  const validationErrorClasses = [
    // Layout
    "flex-shrink-0 bg-red-50 border-l-4 border-red-400 rounded",
    // Spacing
    "p-2 sm:p-3 mx-2 sm:mx-4 mb-2",
    // Scrolling
    "max-h-20 sm:max-h-24 overflow-y-auto"
  ].join(" ");

  const inputAreaClasses = [
    // Layout
    "flex-shrink-0 border-t border-gray-100 bg-white",
    // Spacing
    "p-2 sm:p-4",
    // Height management
    "max-h-[40%] sm:max-h-[35%] lg:max-h-[30%] overflow-y-auto"
  ].join(" ");

  const loadingIndicatorClasses = [
    "flex items-center justify-center py-2 sm:py-4"
  ].join(" ");

  const spinnerClasses = [
    "text-gray-500 text-xs sm:text-sm flex items-center gap-2"
  ].join(" ");

  const spinnerIconClasses = [
    "animate-spin rounded-full border-2 border-gray-300 border-t-gray-600",
    "h-3 w-3 sm:h-4 sm:w-4"
  ].join(" ");

  return (
    <div className={containerClasses}>
      {/* Top gradient line */}
      <div className={gradientLineClasses} />
      
      {/* Progress Indicator */}
      <div className="flex-shrink-0">
        <ProgressIndicator currentStep={conversationStep} progressTexts={progressTexts} />
      </div>
      
      {/* Chat Header */}
      <div className="flex-shrink-0">
        <ChatHeader showTyping={showTyping} />
      </div>
      
      {/* Messages Area - main flexible area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      
      {/* Validation Errors Display */}
      {validationErrors.length > 0 && (
        <div className={validationErrorClasses}>
          <div className="text-xs sm:text-sm text-red-700">
            <strong>Please fix the following issues:</strong>
            <ul className="mt-1 list-disc list-inside space-y-0.5">
              {validationErrors.map((error, index) => (
                <li key={index} className="break-words">{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className={inputAreaClasses}>
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
          <div className={loadingIndicatorClasses}>
            <div className={spinnerClasses}>
              <div className={spinnerIconClasses}></div>
              Processing...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;