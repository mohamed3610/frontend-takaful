import React, { useState, useRef, useEffect } from 'react';
import { finalOptions } from '../../data/ConversationFlow';

interface ChatInputProps {
  inputType: 'input' | 'options' | 'loading';
  currentStep: any;
  showFinalOptions?: boolean;
  onUserInput: (value: { text: string; sender: 'user' }) => void;
  onOptionSelect?: (selection: { text: string; value: string }) => void;
  onFinalAction: (action: string) => void;
  userData: any;
  // New props for go back functionality
  conversationStep?: number;
  stepHistory?: number[];
  onGoBack?: (stepIndex: number) => void;
  conversationFlow?: any[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputType,
  currentStep,
  showFinalOptions = false,
  onUserInput,
  onOptionSelect,
  onFinalAction,
  userData,
  conversationStep = 0,
  stepHistory = [],
  onGoBack,
  conversationFlow = []
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [showGoBackMenu, setShowGoBackMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when it becomes active
  useEffect(() => {
    if (inputType === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputType]);

  // Validate input
  useEffect(() => {
    if (currentStep?.validation) {
      setIsValid(currentStep.validation(inputValue));
    } else {
      setIsValid(inputValue.trim().length > 0);
    }
  }, [inputValue, currentStep]);

  // Handle send button click
  const handleSend = () => {
    if (!isValid || !inputValue.trim()) return;
    
    onUserInput({ text: inputValue.trim(), sender: 'user' });
    setInputValue('');
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSend();
    }
  };

  // Handle option click
  const handleOptionClick = (option: any) => {
    if (showFinalOptions) {
      // Final actions are not part of the scripted flow; echo and trigger action
      onUserInput({ text: option.text, sender: 'user' });
      onFinalAction(option.action);
    } else if (onOptionSelect) {
      // Pass both text and value upward; parent will add a single user message
      onOptionSelect({ text: option.text, value: option.value });
    }
  };

  // Get display text for option
  const getOptionText = (option: any) => {
    return showFinalOptions ? option.text : option.text;
  };

  // Helper function to get user-friendly step names
  const getStepDisplayName = (step: any): string => {
    const stepNames: Record<string, string> = {
      'check_registration': 'account type selection',
      'existing_login': 'email input',
      'email_verification_check': 'email verification',
      'email_not_found': 'email options',
      'send_otp': 'verification code',
      'existing_welcome_back': 'welcome back',
      'new_customer_welcome': 'name input',
      'new_customer_email': 'email input',
      'phone_number': 'phone number',
      'street_address': 'street address',
      'city': 'city',
      'state': 'state',
      'zip_code': 'ZIP code',
      'property_type': 'property type',
      'construction_year': 'construction year',
      'home_value': 'home value',
      'square_footage': 'square footage',
      'construction_material': 'construction material',
      'roof_type': 'roof type',
      'foundation_type': 'foundation type',
      'stories': 'number of stories',
      'bedrooms': 'bedrooms',
      'bathrooms': 'bathrooms',
      'garage': 'garage information',
      'pool': 'pool information',
      'smoke_detectors': 'smoke detectors',
      'security_system': 'security system',
      'previous_claims': 'claims history',
      'coverage_preference': 'coverage level',
      'deductible_preference': 'deductible amount',
      'generate_quote': 'quote generation'
    };
    
    return stepNames[step.id] || step.id;
  };

  // Get available steps to go back to
  const getGoBackOptions = () => {
    if (!stepHistory.length || !conversationFlow.length) return [];
    
    // Get unique steps from history, excluding current step
    const uniqueSteps = [...new Set(stepHistory)]
      .filter(stepIndex => stepIndex < conversationStep)
      .slice(-5); // Show last 5 steps only
    
    return uniqueSteps.map(stepIndex => {
      const step = conversationFlow[stepIndex];
      return {
        stepIndex,
        step,
        displayName: step ? getStepDisplayName(step) : `Step ${stepIndex + 1}`
      };
    }).reverse(); // Show most recent first
  };

  // Handle go back click
  const handleGoBack = (stepIndex: number) => {
    if (onGoBack) {
      onGoBack(stepIndex);
      setShowGoBackMenu(false);
    }
  };

  // Determine if go back button should be shown
  const shouldShowGoBack = () => {
    // Don't show during loading states or final options
    if (inputType === 'loading' || showFinalOptions) return false;
    
    // Don't show on very first steps
    if (conversationStep <= 1) return false;
    
    // Don't show if no history or onGoBack function
    if (!stepHistory.length || !onGoBack) return false;
    
    return true;
  };

  // Go Back Button Component
  const GoBackButton = () => {
    if (!shouldShowGoBack()) return null;
    
    const goBackOptions = getGoBackOptions();
    
    if (!goBackOptions.length) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setShowGoBackMenu(!showGoBackMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-sm text-gray-600 hover:text-gray-800 transition-all duration-200"
          title="Go back to previous step"
        >
          <span>←</span>
          <span>Go Back</span>
        </button>
        
        {showGoBackMenu && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-64">
            <div className="p-3 border-b border-gray-100">
              <div className="font-semibold text-sm text-gray-700">Go back to:</div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {goBackOptions.map(({ stepIndex, displayName }) => (
                <button
                  key={stepIndex}
                  onClick={() => handleGoBack(stepIndex)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                >
                  <div className="text-sm font-medium text-gray-800 capitalize">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Step {stepIndex + 1}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => setShowGoBackMenu(false)}
                className="w-full text-center py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Text Input Component
  if (inputType === 'input' && currentStep) {
    return (
      <div className="space-y-3">
        {/* Go Back Button */}
        <GoBackButton />
        
        {/* Input Row */}
        <div className="flex items-end gap-3">
          <input
            ref={inputRef}
            type={currentStep.inputType || 'text'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentStep.placeholder || 'Type your answer...'}
            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-full text-base transition-all duration-300 focus:outline-none focus:border-[var(--gold)] bg-white font-poppins"
            style={{ minHeight: '50px' }}
          />
          <button
            onClick={handleSend}
            disabled={!isValid}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl transition-all duration-300 ${
              isValid 
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--emerald)] hover:scale-110 hover:shadow-lg cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            →
          </button>
        </div>
      </div>
    );
  }

  // Options Component
  if (inputType === 'options') {
    // Use final options if showing final options, otherwise use current step options
    const options = showFinalOptions ? finalOptions : (currentStep?.options || []);
    
    return (
      <div className="space-y-3">
        {/* Go Back Button */}
        <GoBackButton />
        
        {/* Options */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {options.map((option: any, index: number) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              className="w-full bg-[var(--cream)] hover:bg-gradient-to-r hover:from-[var(--gold)]/10 hover:to-[var(--emerald)]/10 border-2 border-transparent hover:border-[var(--gold)] rounded-2xl p-4 text-left transition-all duration-300 hover:transform hover:translate-x-2 group"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[var(--deep-blue)] group-hover:text-[var(--gold)] transition-colors duration-300">
                    {getOptionText(option)}
                  </div>
                  <div className="text-sm text-[var(--text-light)] mt-1 leading-snug">
                    {option.desc || option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Return null for loading state (handled by parent)
  return null;
};

export default ChatInput;