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
      onUserInput({ text: option.text, sender: 'user' });
      onFinalAction(option.action);
    } else if (onOptionSelect) {
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
    
    const uniqueSteps = [...new Set(stepHistory)]
      .filter(stepIndex => stepIndex < conversationStep)
      .slice(-5);
    
    return uniqueSteps.map(stepIndex => {
      const step = conversationFlow[stepIndex];
      return {
        stepIndex,
        step,
        displayName: step ? getStepDisplayName(step) : `Step ${stepIndex + 1}`
      };
    }).reverse();
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
    if (inputType === 'loading' || showFinalOptions) return false;
    if (conversationStep <= 1) return false;
    if (!stepHistory.length || !onGoBack) return false;
    return true;
  };

  // Organized Tailwind class groups
  const containerClasses = [
    "space-y-2 sm:space-y-3"
  ].join(" ");

  const inputRowClasses = [
    "flex items-end gap-2 sm:gap-3"
  ].join(" ");

  const goBackButtonClasses = [
    // Layout & Structure
    "flex items-center gap-1 sm:gap-2 max-w-fit",
    // Spacing
    "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2",
    // Background & Border
    "bg-gray-100 hover:bg-gray-200 border border-gray-300",
    // Border Radius
    "rounded-md sm:rounded-lg",
    // Text
    "text-xs sm:text-sm text-gray-600 hover:text-gray-800",
    // Animation
    "transition-all duration-200"
  ].join(" ");

  const goBackMenuClasses = [
    // Layout & Position
    "absolute bottom-full left-0 mb-2 z-50",
    // Background & Border
    "bg-white border border-gray-200 rounded-lg shadow-lg",
    // Size
    "min-w-48 sm:min-w-64 max-w-xs"
  ].join(" ");

  const menuHeaderClasses = [
    "p-2 sm:p-3 border-b border-gray-100"
  ].join(" ");

  const menuScrollAreaClasses = [
    "max-h-32 sm:max-h-48 overflow-y-auto"
  ].join(" ");

  const menuItemClasses = [
    "w-full text-left px-3 sm:px-4 py-2 sm:py-3",
    "hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
    "transition-colors duration-150"
  ].join(" ");

  const menuItemTitleClasses = [
    "text-xs sm:text-sm font-medium text-gray-800 capitalize truncate"
  ].join(" ");

  const menuItemSubtitleClasses = [
    "text-xs text-gray-500 mt-1"
  ].join(" ");

  const menuFooterClasses = [
    "p-2 border-t border-gray-100"
  ].join(" ");

  const cancelButtonClasses = [
    "w-full text-center py-1 text-xs text-gray-500 hover:text-gray-700"
  ].join(" ");

  const inputFieldClasses = [
    // Layout
    "flex-1",
    // Spacing
    "px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3",
    // Border & Background
    "border-2 border-gray-200 bg-white rounded-full",
    // Text
    "text-sm sm:text-base font-poppins",
    // Focus & Animation
    "transition-all duration-300 focus:outline-none focus:border-[var(--gold)]"
  ].join(" ");

  const getSendButtonClasses = (isValid: boolean) => [
    // Layout & Size
    "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex-shrink-0",
    "flex items-center justify-center",
    // Text
    "text-white text-sm sm:text-lg md:text-xl",
    // Animation
    "transition-all duration-300",
    // Conditional styling
    isValid 
      ? "bg-gradient-to-r from-[var(--gold)] to-[var(--emerald)] hover:scale-110 hover:shadow-lg cursor-pointer"
      : "bg-gray-300 cursor-not-allowed opacity-50"
  ].join(" ");

  const optionsContainerClasses = [
    "space-y-2 sm:space-y-3",
    "max-h-60 sm:max-h-80 md:max-h-96 overflow-y-auto",
    "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
  ].join(" ");

  const optionButtonClasses = [
    // Layout
    "w-full text-left group",
    // Background & Border
    "bg-[var(--cream)] border-2 border-transparent",
    "hover:bg-gradient-to-r hover:from-[var(--gold)]/10 hover:to-[var(--emerald)]/10",
    "hover:border-[var(--gold)]",
    // Border Radius
    "rounded-lg sm:rounded-xl md:rounded-2xl",
    // Spacing
    "p-2 sm:p-3 md:p-4",
    // Animation
    "transition-all duration-300 hover:transform hover:translate-x-1 sm:hover:translate-x-2"
  ].join(" ");

  const optionContentClasses = [
    "flex items-center gap-2 sm:gap-3 md:gap-4"
  ].join(" ");

  const optionIconClasses = [
    "text-lg sm:text-xl md:text-2xl w-6 sm:w-8 text-center flex-shrink-0"
  ].join(" ");

  const optionTextContainerClasses = [
    "flex-1 min-w-0"
  ].join(" ");

  const optionTextClasses = [
    // Text styling
    "font-semibold text-[var(--deep-blue)] group-hover:text-[var(--gold)]",
    "text-sm sm:text-base truncate",
    // Animation
    "transition-colors duration-300"
  ].join(" ");

  const optionDescClasses = [
    // Text styling
    "text-xs sm:text-sm text-[var(--text-light)]",
    // Spacing
    "mt-0.5 sm:mt-1 leading-snug line-clamp-2"
  ].join(" ");

  // Go Back Button Component
  const GoBackButton = () => {
    if (!shouldShowGoBack()) return null;
    
    const goBackOptions = getGoBackOptions();
    if (!goBackOptions.length) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setShowGoBackMenu(!showGoBackMenu)}
          className={goBackButtonClasses}
          title="Go back to previous step"
        >
          <span className="text-sm sm:text-base">←</span>
          <span className="hidden xs:inline">Go Back</span>
          <span className="xs:hidden">Back</span>
        </button>
        
        {showGoBackMenu && (
          <div className={goBackMenuClasses}>
            <div className={menuHeaderClasses}>
              <div className="font-semibold text-xs sm:text-sm text-gray-700">Go back to:</div>
            </div>
            <div className={menuScrollAreaClasses}>
              {goBackOptions.map(({ stepIndex, displayName }) => (
                <button
                  key={stepIndex}
                  onClick={() => handleGoBack(stepIndex)}
                  className={menuItemClasses}
                >
                  <div className={menuItemTitleClasses}>
                    {displayName}
                  </div>
                  <div className={menuItemSubtitleClasses}>
                    Step {stepIndex + 1}
                  </div>
                </button>
              ))}
            </div>
            <div className={menuFooterClasses}>
              <button
                onClick={() => setShowGoBackMenu(false)}
                className={cancelButtonClasses}
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
      <div className={containerClasses}>
        <GoBackButton />
        
        <div className={inputRowClasses}>
          <input
            ref={inputRef}
            type={currentStep.inputType || 'text'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentStep.placeholder || 'Type your answer...'}
            className={inputFieldClasses}
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={handleSend}
            disabled={!isValid}
            className={getSendButtonClasses(isValid)}
          >
            →
          </button>
        </div>
      </div>
    );
  }

  // Options Component
  if (inputType === 'options') {
    const options = showFinalOptions ? finalOptions : (currentStep?.options || []);
    
    return (
      <div className={containerClasses}>
        <GoBackButton />
        
        <div className={optionsContainerClasses}>
          {options.map((option: any, index: number) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              className={optionButtonClasses}
            >
              <div className={optionContentClasses}>
                <div className={optionIconClasses}>
                  {option.icon}
                </div>
                <div className={optionTextContainerClasses}>
                  <div className={optionTextClasses}>
                    {getOptionText(option)}
                  </div>
                  <div className={optionDescClasses}>
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