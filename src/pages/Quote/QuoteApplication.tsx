import React, { useState, useEffect } from 'react';
import MainLayout from './MainLayout';
import ChatInterface from './ChatInterface';
import WelcomeScreen from './WelcomeScreen';
import { conversationFlow, progressTexts } from '../../data/ConversationFlow';
import "../../styles/quote.css";
import { registerUser } from '../../api/auth';
import { createProperty } from '../../api/property';
import { createQuote } from '../../api/quote';
import type { 
  PropertyCreateRequestSchema, 
  QuoteCreateRequestSchema,
  RegisterUserRequestSchema,
  PropertyTypes,
  ConstructionMaterials,
  RoofTypes,
  FoundationTypes,
  QuoteStatus
} from '../../api/schemas';

const QuoteApplication = () => {
  const [conversationStep, setConversationStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>({});
  const [awaitingUser, setAwaitingUser] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showFinalOptions, setShowFinalOptions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [canSendMessage, setCanSendMessage] = useState(true);
  const [stepHistory, setStepHistory] = useState<number[]>([]);
  const [messageIdCounter, setMessageIdCounter] = useState(0);

  // Debug logging for development
  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      console.log('Current userData:', userData);
   
    }
  }, [userData, conversationStep]);

  // Fixed message functions with better unique ID generation
  const addAssistantMessage = (content: string, step?: any, extra?: any) => {
    const messageId = `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setMessages(prev => [
      ...prev,
      { id: messageId, type: 'assistant', content, step, ...(extra || {}) }
    ]);
  };

  const addUserMessage = (content: string) => {
    const messageId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setMessages(prev => [...prev, { id: messageId, type: 'user', content }]);
  };

  const addErrorMessage = (errors: string[]) => {
    const errorMessage = `I found some issues that need to be fixed:\n\n${errors.map(err => `• ${err}`).join('\n')}\n\nPlease correct these and try again.`;
    addAssistantMessage(errorMessage);
  };

  const getFriendlyName = () => {
    const rawName = userData.full_name || userData.name || '';
    if (!rawName || typeof rawName !== 'string') return 'friend';
    const first = rawName.trim().split(/\s+/)[0];
    return first || 'friend';
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

  // Enhanced step history management
  const updateStepHistory = (currentStep: number) => {
    setStepHistory(prev => {
      if (prev.length === 0 || prev[prev.length - 1] !== currentStep) {
        const newHistory = [...prev, currentStep];
        return newHistory.slice(-10); // Keep only last 10 steps
      }
      return prev;
    });
  };

  // MOCK ONLY: Email verification function
  const verifyEmailExists = async (email: string): Promise<boolean> => {

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For testing: only these emails exist in the system
    const existingEmails = ['test@example.com', 'ahmed@takaful.com', 'user@test.com'];
    const exists = existingEmails.includes(email.toLowerCase());
  
    return exists;
  };

  // Mock validation functions
  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name || name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    if (name.trim().length > 50) return `${fieldName} must be less than 50 characters`;
    return null;
  };

  const validatePhoneNumber = (phone: string): string | null => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    return null;
  };

  // Enhanced validation using schema constraints
  const validateUserData = (): string[] => {
    const errors: string[] = [];
    
    // Required fields
    if (!userData.full_name) errors.push('Full name is required');
    if (!userData.email) errors.push('Email is required');
    if (!userData.phone_number) errors.push('Phone number is required');
    if (!userData.street_address) errors.push('Street address is required');
    if (!userData.city) errors.push('City is required');
    if (!userData.state) errors.push('State is required');
    if (!userData.zip_code) errors.push('ZIP code is required');
    
    // Schema-based validation
    if (userData.state && userData.state.length < 2) errors.push('State must be at least 2 characters');
    if (userData.zip_code && !/^\d{5}(-\d{4})?$/.test(userData.zip_code)) errors.push('ZIP code must be in format 12345 or 12345-6789');
    
    // Numeric validations
    if (userData.construction_year) {
      const year = parseInt(userData.construction_year);
      if (isNaN(year) || year < 1800 || year > new Date().getFullYear()) {
        errors.push('Construction year must be between 1800 and current year');
      }
    }
    
    if (userData.home_value) {
      const value = parseInt(userData.home_value);
      if (isNaN(value) || value < 10000) {
        errors.push('Home value must be at least $10,000');
      }
    }
    
    if (userData.square_footage) {
      const sqft = parseInt(userData.square_footage);
      if (isNaN(sqft) || sqft < 100) {
        errors.push('Square footage must be at least 100');
      }
    }
    
    // Enum validations
    const validPropertyTypes: PropertyTypes[] = ['single_family', 'townhouse', 'condo'];
    if (userData.property_type && !validPropertyTypes.includes(userData.property_type as PropertyTypes)) {
      errors.push('Property type must be: single_family, townhouse, or condo');
    }
    
    const validConstructionMaterials: ConstructionMaterials[] = ['frame', 'masonry', 'steel', 'concrete', 'other'];
    if (userData.construction_material && !validConstructionMaterials.includes(userData.construction_material as ConstructionMaterials)) {
      errors.push('Construction material must be: frame, masonry, steel, concrete, or other');
    }
    
    const validRoofTypes: RoofTypes[] = ['composition_shingle', 'metal', 'tile', 'slate', 'other'];
    if (userData.roof_type && !validRoofTypes.includes(userData.roof_type as RoofTypes)) {
      errors.push('Roof type must be: composition_shingle, metal, tile, slate, or other');
    }
    
    const validFoundationTypes: FoundationTypes[] = ['slab', 'basement', 'crawl_space', 'pier_beam'];
    if (userData.foundation_type && !validFoundationTypes.includes(userData.foundation_type as FoundationTypes)) {
      errors.push('Foundation type must be: slab, basement, crawl_space, or pier_beam');
    }
    
    return errors;
  };

  const sanitizeUserData = () => {
    return {
      ...userData,
      full_name: String(userData.full_name || '').trim(),
      email: String(userData.email || '').trim().toLowerCase(),
      phone_number: String(userData.phone_number || '').trim(),
      street_address: String(userData.street_address || '').trim(),
      city: String(userData.city || '').trim(),
      state: String(userData.state || '').trim(),
      zip_code: String(userData.zip_code || '').trim()
    };
  };

  // MOCK ONLY: Email verification handler
  const handleEmailVerification = async () => {
    try {
   

      // Show verification in progress message
      addAssistantMessage("🔍 Checking if this email exists in our system...");

      const emailExists = await verifyEmailExists(userData.email);
 

      // Clear typing and processing states first
      setShowTyping(false);
      setIsProcessing(false);

      if (emailExists) {
        // ✅ Email found - navigate to OTP step
        setUserData((prev) => ({
          ...prev,
          email_verified: true,
          email_not_found: false,
          user_type: 'existing_customer' // CRITICAL: Set user type
        }));

        // Add success message
        addAssistantMessage("✅ Great! I found your account. Let me send you a verification code.");

        // Navigate to OTP step after a short delay
        setTimeout(() => {
          const otpStepIndex = conversationFlow.findIndex(
            (step) => step.id === "send_otp"
          );
          if (otpStepIndex !== -1) {
          
            setConversationStep(otpStepIndex);
            setTimeout(() => {
              setIsProcessing(false);
              setAwaitingUser(false);
            }, 100);
          }
        }, 1000);

      } else {
        // ❌ Email not found
        setUserData((prev) => ({
          ...prev,
          email_verified: false,
          email_not_found: true,
        }));

        const emailNotFoundStepIndex = conversationFlow.findIndex(
          (step) => step.id === "email_not_found"
        );

        if (emailNotFoundStepIndex !== -1) {
          const step = conversationFlow[emailNotFoundStepIndex];

          const messageText =
            typeof step.message === "function"
              ? step.message(getFriendlyName())
              : step.message;

    

          setTimeout(() => {
            addAssistantMessage(messageText || "I couldn't find an account with that email address.", step);
            
            setConversationStep(emailNotFoundStepIndex);
            setAwaitingUser(true);
            setIsProcessing(false);
            setShowTyping(false);
          }, 800);

        } else {
          // Fallback if step not found
          const fallbackMessage = "❌ I couldn't find an account with that email address. What would you like to do?";
          const fallbackStep = {
            id: "email_not_found_fallback",
            type: "options",
            options: [
              { text: "Try a different email", value: "retry_email" },
              { text: "Continue as new customer", value: "continue_as_new" },
              { text: "Contact support", value: "contact_support" }
            ]
          };
          
          addAssistantMessage(fallbackMessage, fallbackStep);
          setIsProcessing(false);
          setAwaitingUser(true);
        }
      }
    } catch (error) {
      console.error("MOCK: Email verification failed:", error);
      addAssistantMessage(
        "⚠️ Sorry, I couldn't verify the email right now due to a technical issue.\n\n" +
          "Please try again in a moment, or contact our support team if the problem persists."
      );
      setIsProcessing(false);
      setShowTyping(false);
      setAwaitingUser(true);
    }
  };

  // Enhanced processNextStep function with better user type handling
  const processNextStep = () => {
    if (awaitingUser) {
   
      return;
    }

    if (isProcessing) {
  
      return;
    }

    updateStepHistory(conversationStep);

    let nextStepIndex = conversationStep;
    let step;

  

    step = conversationFlow[nextStepIndex];

    // Check if step exists
    if (!step) {
      console.error("No step found at index:", nextStepIndex);
   
      addAssistantMessage("I encountered an issue with the conversation flow. Please contact support.");
      return;
    }

  

    // FIXED: Enhanced condition checking that prevents backward navigation issues
    do {
      step = conversationFlow[nextStepIndex];
      if (!step) {
      
        return;
      }

  

      // CRITICAL FIX: Pass updated userData including user_type to condition check
      const currentUserData = { ...userData };
      
      // FIXED: More specific backward navigation prevention
      if (step.condition) {
        const conditionResult = step.condition(currentUserData);
        
        if (!conditionResult) {
      
          nextStepIndex++;
          continue;
        }
      }
      
      // CRITICAL FIX: Prevent re-execution of completed authentication steps
      const completedAuthSteps = ['check_registration', 'existing_login', 'email_verification_check', 
                                 'email_not_found', 'send_otp', 'existing_welcome_back'];
      
      if (completedAuthSteps.includes(step.id) && 
          currentUserData.user_type === 'existing_customer' && 
          currentUserData.otp_verified && 
          nextStepIndex < conversationStep) { // Only skip if we're looking at a previous step
     
        nextStepIndex++;
        continue;
      }

   
      break;
    } while (nextStepIndex < conversationFlow.length);

    if (!step) {
   
      return;
    }

  
    setIsProcessing(true);
    setShowTyping(true);
    setAwaitingUser(false);

    const messageText =
      typeof step.message === "function" ? step.message(getFriendlyName()) : step.message;

    setTimeout(() => {
      setShowTyping(false);

      // Handle different step types
      if (step.type === "options" && step.options?.length > 0) {
  
        
        const displayMessage = messageText || "Please choose an option:";
        addAssistantMessage(displayMessage, step);
        
        setAwaitingUser(true);
        setIsProcessing(false);
        return;

      } else if (step.type === "loading") {
        // Handle loading steps
        if (step.id === "generate_quote") {
          if (messageText) addAssistantMessage(messageText, step);
          handleQuoteGeneration(step);
        } else if (step.id === "email_verification_check") {
       
          if (messageText) addAssistantMessage(messageText, step);
          handleEmailVerification();
        } else {
    
          if (messageText) addAssistantMessage(messageText, step);
          setAwaitingUser(true);
          setIsProcessing(false);
        }

      } else if (step.id === "send_otp") {
        // Special handling for OTP step

        if (messageText) addAssistantMessage(messageText, step);
        handleOTPSending();

      } else {
        // Regular input/text steps
        
        if (messageText) addAssistantMessage(messageText, step);
        setAwaitingUser(true);
        setIsProcessing(false);
      }
    }, 800);
  };

  // MOCK ONLY: OTP sending handler
  const handleOTPSending = async () => {
    // Check if OTP step was already handled manually to prevent duplicates
    if (userData.otp_step_handled) {
   
      return;
    }
    
 
 
    
    // Show a static message that OTP was "sent"
    setTimeout(() => {
      addAssistantMessage("📧 Verification code sent! For testing, use: 123456");
      setAwaitingUser(true);
      setIsProcessing(false);
    }, 1000);
  };

  // MOCK ONLY: OTP verification
  const verifyOTP = async (otpCode: string) => {
 
    setIsProcessing(true);
    setShowTyping(true);
    
    // Static verification for testing OTP flow only - accept "123456" as valid
    const isValidOTP = otpCode === '123456';
    
    setTimeout(() => {
      setShowTyping(false);
      
      if (isValidOTP) {
      
        
        // Generate a proper UUID format for existing customer mock data
        const generateMockUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
        
        // Simulate loading user data for existing customer (static for testing)
        const simulatedUserData = {
          full_name: 'Ahmed Hassan',
          phone_number: '+1234567890',
          otp_verified: true,
          user_type: 'existing_customer',
          user_id: generateMockUUID() // FIXED: Generate proper UUID format
        };
        
        setUserData(prev => ({...prev, ...simulatedUserData}));
        
        addAssistantMessage("Perfect! You're now logged in. 🎉");
        
        // Navigate to the welcome back step with proper step processing
        setTimeout(() => {
          const welcomeBackStepIndex = conversationFlow.findIndex(step => step.id === 'existing_welcome_back');
          if (welcomeBackStepIndex !== -1) {
         
            setConversationStep(welcomeBackStepIndex);
            setIsProcessing(false);
            setAwaitingUser(false);
          } else {
            console.error('existing_welcome_back step not found in conversationFlow');
            // Create manual welcome back options if step is missing
            const welcomeBackStep = {
              id: 'existing_welcome_back_manual',
              type: 'options',
              message: `Welcome back, ${getFriendlyName()}! 🎉 What would you like to do today?`,
              options: [
                { text: 'Get a new quote for my property', value: 'new_quote' },
                { text: 'Review my existing policies', value: 'review_policies' },
                { text: 'Update my information', value: 'update_info' },
                { text: 'Exit', value: 'exit' }
              ]
            };
            
            addAssistantMessage(welcomeBackStep.message, welcomeBackStep);
            setIsProcessing(false);
            setAwaitingUser(true);
          }
        }, 800);
      } else {
     
        addAssistantMessage("The verification code doesn't match. Please use: 123456 for testing.");
        setAwaitingUser(true);
        setIsProcessing(false);
      }
    }, 1500);
  };

  // Enhanced go back functionality with proper state management
  const goBackToStep = (targetStepIndex: number) => {

    
    if (targetStepIndex < 0 || targetStepIndex >= conversationFlow.length) {
      console.error('Invalid target step index:', targetStepIndex);
      return;
    }

    const targetStep = conversationFlow[targetStepIndex];
    if (!targetStep) {
      console.error('Target step not found:', targetStepIndex);
      return;
    }

   

    // Reset processing states
    setIsProcessing(false);
    setShowTyping(false);
    setAwaitingUser(false);
    setShowFinalOptions(false);
    setValidationErrors([]);
    setCanSendMessage(true);

    // Clear any step-specific user data that comes after the target step
    const updatedUserData = { ...userData };
    
    // Find all steps after the target step and clear their associated data
    for (let i = targetStepIndex + 1; i < conversationFlow.length; i++) {
      const step = conversationFlow[i];
      if (step.field && updatedUserData[step.field] !== undefined) {
       
        delete updatedUserData[step.field];
      }
    }

    // Clear specific flags that might be set in later steps
    const fieldsToReset = [
      'email_verified', 
      'email_not_found', 
      'otp_verified', 
      'otp_code',
      'quote_type'
    ];
    
    fieldsToReset.forEach(field => {
      const fieldStepIndex = conversationFlow.findIndex(step => 
        step.id === 'email_verification_check' && field === 'email_verified' ||
        step.id === 'email_not_found' && field === 'email_not_found' ||
        step.id === 'send_otp' && field === 'otp_verified' ||
        step.id === 'send_otp' && field === 'otp_code' ||
        step.id === 'existing_welcome_back' && field === 'quote_type'
      );
      
      if (fieldStepIndex > targetStepIndex && updatedUserData[field] !== undefined) {

        delete updatedUserData[field];
      }
    });

    setUserData(updatedUserData);
    
    // Add a "going back" message to indicate the action
    const friendlyStepName = getStepDisplayName(targetStep);
    addAssistantMessage(`Let's go back to: ${friendlyStepName}`);
    
    // Set the conversation step and let processNextStep handle it
    setTimeout(() => {
      setConversationStep(targetStepIndex);
    }, 500);
  };

  const handleUserResponse = (value: any, step: any) => {
    try {
      if (isProcessing || !canSendMessage) return;

      const isSelection = value && typeof value === 'object' && 'text' in value && 'value' in value;
      const messageContent = isSelection ? value.text : (typeof value === 'string' ? value : value.text || value);
      addUserMessage(messageContent);

      // Handle special cases for existing customer welcome back options
      if (step?.id === 'existing_welcome_back_manual' && isSelection) {
        if (value.value === 'new_quote') {
          addAssistantMessage("Great! Let's get a quote for your property. I'll need some details about your home.");
          
          setTimeout(() => {
            const propertyStepIndex = conversationFlow.findIndex(s => s.id === 'street_address');
            if (propertyStepIndex !== -1) {
              setConversationStep(propertyStepIndex);
            } else {
              setConversationStep(prev => prev + 1);
            }
          }, 800);
          return;
          
        } else if (value.value === 'review_policies') {
          addAssistantMessage("I'd be happy to help you review your existing policies. This feature will be available soon. For now, please contact our support team at 1-800-TAKAFUL.");
          setAwaitingUser(true);
          setIsProcessing(false);
          return;
          
        } else if (value.value === 'update_info') {
          addAssistantMessage("Let's update your information. This feature will be available soon. For now, please contact our support team at 1-800-TAKAFUL.");
          setAwaitingUser(true);
          setIsProcessing(false);
          return;
          
        } else if (value.value === 'exit') {
          addAssistantMessage("Thank you for visiting Takaful! Have a blessed day. Assalamu alaikum! 🌟");
          setAwaitingUser(false);
          setIsProcessing(false);
          return;
        }
      }

      // Handle special cases for email_not_found step
      if (step?.id === 'email_not_found' && isSelection) {
        if (value.value === 'retry_email') {
          setUserData(prev => ({ 
            ...prev, 
            email_not_found: false,
            email: ''
          }));
          
          addAssistantMessage("No problem! Let's try with a different email address.");
          
          setTimeout(() => {
            const emailStepIndex = conversationFlow.findIndex(s => s.id === 'existing_login');
            setConversationStep(emailStepIndex);
          }, 800);
          return;
          
        } else if (value.value === 'continue_as_new') {
          setUserData(prev => ({ 
            ...prev, 
            user_type: 'new_customer',
            email_choice: 'continue_as_new',
            email_not_found: false 
          }));
          
          addAssistantMessage("Perfect! Let's get you set up as a new customer.");
          
          setTimeout(() => {
            const newCustomerStepIndex = conversationFlow.findIndex(s => s.id === 'new_customer_welcome');
            setConversationStep(newCustomerStepIndex);
          }, 800);
          return;
          
        } else if (value.value === 'contact_support') {
          addAssistantMessage(
            "I understand you'd like help finding your account. Here are your options:\n\n" +
            "📞 **Call us:** 1-800-TAKAFUL (1-800-825-2385)\n" +
            "💬 **Live Chat:** Available on our website 24/7\n" +
            "📧 **Email:** support@takaful.com\n\n" +
            "Our support team can help you:\n" +
            "• Locate your existing account\n" +
            "• Reset your login credentials\n" +
            "• Update your contact information\n\n" +
            "Would you like to continue with getting a new quote while you sort out your account?"
          );
          
          setAwaitingUser(true);
          setIsProcessing(false);
          return;
        }
      }

      // MOCK ONLY: Handle OTP verification - FIXED to only trigger for OTP steps
      if (step?.id === 'send_otp') {
        const otpCode = isSelection ? value.value : messageContent;
        if (!/^\d{6}$/.test(otpCode.trim())) {
          addAssistantMessage("Please enter a valid 6-digit verification code.");
          return;
        }
        verifyOTP(otpCode.trim());
        return;
      }

      // Real-time validation for specific fields
      if (step?.field) {
        const storedValue = isSelection ? value.value : messageContent;
        
        if (step.field === 'email') {
          const emailError = validateEmail(storedValue);
          if (emailError) {
            addAssistantMessage(`I notice there's an issue with that email: ${emailError}. Please provide a valid email address.`);
            return;
          }
        }
        
        if (['full_name', 'name'].includes(step.field)) {
          const nameError = validateName(storedValue, 'Name');
          if (nameError) {
            addAssistantMessage(`I notice there's an issue with that name: ${nameError}. Please provide a valid name.`);
            return;
          }
        }
        
        if (step.field === 'phone_number') {
          const phoneError = validatePhoneNumber(storedValue);
          if (phoneError) {
            addAssistantMessage(`I notice there's an issue with that phone number: ${phoneError}. Please provide a valid phone number.`);
            return;
          }
        }
      }

      // Update user data with proper user_type preservation
      if (step?.field) {
        const storedValue = isSelection ? value.value : messageContent;
        setUserData((prev: any) => ({ 
          ...prev, 
          [step.field]: storedValue
        }));
      }

      // Update step history before moving to next step
      updateStepHistory(conversationStep);

      // Reset awaitingUser state before moving to next step
      setAwaitingUser(false);
      setIsProcessing(false);

      setTimeout(() => {
        // Find next valid step index with updated userData
        const updatedUserData = step?.field ? 
          { ...userData, [step.field]: isSelection ? value.value : messageContent } : 
          userData;

        let nextStepIndex = conversationStep + 1;
        while (nextStepIndex < conversationFlow.length) {
          const nextStep = conversationFlow[nextStepIndex];
          if (!nextStep.condition || nextStep.condition(updatedUserData)) {
            break;
          }
          nextStepIndex++;
        }
        
        setConversationStep(nextStepIndex);
      }, 800);
      
    } catch (error) {
      console.error('Error in handleUserResponse:', error);
      addAssistantMessage("I encountered an error processing your response. Please try again.");
      setAwaitingUser(true);
      setIsProcessing(false);
    }
  };

  // REAL API: Enhanced quote generation with proper API integration and schema compliance
  const handleQuoteGeneration = async (step: any) => {
    try {
      setIsProcessing(true);
      setShowTyping(true);
      
   
      
      // Add initial loading message
      addAssistantMessage("🔄 Generating your Shariah-compliant quote...");

      // Validate user data first
      const errors = validateUserData();
      if (errors.length > 0) {
        setShowTyping(false);
        setIsProcessing(false);
        addErrorMessage(errors);
        return;
      }

      const sanitizedData = sanitizeUserData();
      
      // Step 1: Register/create user if new customer - REAL API CALL
      let userId = userData.user_id;
      

      
      if (!userId && userData.user_type === 'new_customer') {
 
        
        const [firstName, ...lastNameParts] = (sanitizedData.full_name || '').split(' ');
        const lastName = lastNameParts.join(' ') || firstName;
        
        const userPayload: RegisterUserRequestSchema = {
          email: sanitizedData.email,
          first_name: firstName,
          last_name: lastName,
          phone_number: sanitizedData.phone_number
        };

        
        const userResult = await registerUser(userPayload);
        userId = userResult.user_id;
        
        // Update userData with user_id
        setUserData(prev => ({ ...prev, user_id: userId }));
       
      }

      if (!userId) {
        console.error('REAL API: No user ID found. UserData:', userData);
        throw new Error(`User ID is required for quote generation. Current user_type: ${userData.user_type}, user_id: ${userId}`);
      }

      // Step 2: Create property with proper schema compliance - 
      
      const propertyPayload: PropertyCreateRequestSchema = {
        user_id: userId,
        street_address: sanitizedData.street_address,
        city: sanitizedData.city,
        state: sanitizedData.state,
        zip_code: sanitizedData.zip_code,
        property_type: (sanitizedData.property_type as PropertyTypes) || 'single_family',
        construction_year: parseInt(sanitizedData.construction_year) || 2000,
        home_value: parseInt(sanitizedData.home_value) || 300000,
        square_footage: parseInt(sanitizedData.square_footage) || 1500,
        construction_material: (sanitizedData.construction_material as ConstructionMaterials) || 'frame',
        roof_type: (sanitizedData.roof_type as RoofTypes) || 'composition_shingle',
        foundation_type: (sanitizedData.foundation_type as FoundationTypes) || 'slab',
        stories: sanitizedData.stories ? parseInt(sanitizedData.stories) : null,
        bedrooms: sanitizedData.bedrooms ? parseInt(sanitizedData.bedrooms) : null,
        bathrooms: sanitizedData.bathrooms ? parseInt(sanitizedData.bathrooms) : null,
        garage: sanitizedData.garage === 'yes' || sanitizedData.garage === true || false,
        pool: sanitizedData.pool === 'yes' || sanitizedData.pool === true || false
      };

      
      
      const propertyResult = await createProperty(propertyPayload);
      const propertyId = propertyResult.property.property_id;


      // Step 3: Create quote with proper schema compliance - 
 
      
      // Calculate dwelling limit (typically 20% higher than home value)
      const dwellingLimit = Math.round((parseInt(sanitizedData.home_value) || 300000) * 1.2);
      
      // Determine deductible based on user preference or default
      let deductible = 1000; // default
      if (sanitizedData.deductible_preference) {
        deductible = parseInt(sanitizedData.deductible_preference) || 1000;
      }

      // Calculate safety discount
      let safetyDiscount = 0;
      if (sanitizedData.security_system === 'yes') safetyDiscount += 10;
      if (sanitizedData.smoke_detectors === 'yes') safetyDiscount += 5;

      const quotePayload: QuoteCreateRequestSchema = {
        property_id: propertyId,
        user_id: userId,
        dwelling_limit: dwellingLimit,
        deductible: deductible,
        safety_discount: safetyDiscount.toString(),
        status: 'generated' as QuoteStatus
      };

     
      
      const quoteResult = await createQuote(quotePayload);
    

      // Step 4: Process and display the quote
      setShowTyping(false);

      // Extract quote data from API response
      const quoteVersion = quoteResult.quote_version;
      const totalPremiumAnnual = parseFloat(quoteResult.total_premium);
      const monthlyPremium = Math.round(totalPremiumAnnual / 12);

      // Build discounts array from API response
      const discounts = quoteVersion.discounts || [];
      
      // Add safety discounts to display
      if (sanitizedData.security_system === 'yes') {
        discounts.push('Security System Discount (10%)');
      }
      if (sanitizedData.smoke_detectors === 'yes') {
        discounts.push('Smoke Detector Discount (5%)');
      }
      if (sanitizedData.previous_claims === 'none') {
        discounts.push('Claims-Free Discount');
      }
      if (discounts.length === 0) {
        discounts.push('New Customer Welcome Discount');
      }

      const quoteData = {
        monthly: monthlyPremium,
        annual: totalPremiumAnnual,
        dwelling_limit: dwellingLimit,
        discounts: discounts,
        quote_id: quoteResult.quote_id,
        version_id: quoteResult.version_id,
        base_premium: parseFloat(quoteVersion.base_premium),
        taxes_and_fees: parseFloat(quoteVersion.taxes_and_fees),
        deductible: deductible
      };

      // Add the QuoteResult message with quote data
      addAssistantMessage("", step, { 
        quote: quoteData,
        isQuoteResult: true,
        quoteId: quoteResult.quote_id
      });
      
      setShowFinalOptions(true);
      setAwaitingUser(true);
      setIsProcessing(false);

    } catch (error) {
      console.error('REAL API: Quote generation failed:', error);
      setShowTyping(false);
      setIsProcessing(false);
      
      let errorMessage = "I apologize, but I encountered an issue while generating your quote. ";
      
      if (error instanceof Error) {
        console.error('REAL API: Error details:', {
          message: error.message,
          stack: error.stack,
          userData: userData,
          apiBaseUrl: (import.meta as any).env?.VITE_API_BASE_URL
        });
        
        // Handle specific API errors
        if (error.message.includes('validation') || error.message.includes('400') || error.message.includes('422')) {
          errorMessage += "There seems to be an issue with the information provided:\n\n";
          
          // Try to extract specific validation errors
          if ((error as any).data && (error as any).data.detail) {
            if (Array.isArray((error as any).data.detail)) {
              const errors = (error as any).data.detail.map((err: any) => {
                const field = err.loc ? err.loc.join('.') : 'unknown field';
                return `• ${field}: ${err.msg}`;
              });
              errorMessage += errors.join('\n');
            } else {
              errorMessage += `• ${(error as any).data.detail}`;
            }
          } else {
            errorMessage += "Please check all fields and try again.";
          }
        } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('TypeError')) {
          errorMessage += "There seems to be a connection issue. Please check your internet connection and try again.";
        } else if (error.message.includes('500')) {
          errorMessage += "Our server is experiencing temporary issues. Please try again in a few minutes.";
        } else {
          errorMessage += `Technical error: ${error.message}`;
        }
      } else {
        errorMessage += "Please try again or contact our support team if the problem persists.";
      }
      
      errorMessage += "\n\n📞 Support: 1-800-TAKAFUL\n💬 Live chat available 24/7";
      
      addAssistantMessage(errorMessage);
      setAwaitingUser(true);
    }
  };

  const handleFinalAction = (action: string) => {
    setShowTyping(true);
    setAwaitingUser(false);

    const quoteRef = `TKF-${Date.now().toString().slice(-6)}`;

    setTimeout(() => {
      setShowTyping(false);
      switch (action) {
        case 'proceed':
          addAssistantMessage(
            "Excellent choice! 🎉\n\nI'm connecting you with our underwriting team to finalize your Shariah-compliant policy. You'll receive:\n\n• Policy documents within 24 hours\n• Payment setup instructions\n• Your Islamic compliance certificate\n• Direct contact for your account manager\n\nBarakallahu feeki for choosing Takaful! Your home will be protected according to Islamic principles."
          );
          break;
        case 'customize':
          addAssistantMessage(
            `Perfect! Our coverage specialist will help you customize your policy to fit your exact needs and budget.\n\nThey'll contact you within 15 minutes to discuss:\n• Adjusting coverage limits\n• Adding optional coverages\n• Optimizing your deductible\n• Special endorsements\n\nYour quote reference number is: ${quoteRef}`
          );
          break;
        case 'agent':
          addAssistantMessage(
            "Wonderful! I'm scheduling a call with one of our licensed Takaful specialists right now.\n\nExpected call time: Within 10 minutes\nSpecialist: Will have your complete quote ready\nTopics: Coverage details, Islamic compliance, next steps\n\nThey'll answer any questions about our Shariah-compliant approach and help you move forward.\n\nJazakallahu khairan for your patience!"
          );
          break;
        case 'email':
          addAssistantMessage(
            `Sending complete quote details to ${String(userData.email || '').trim() || 'your email'} now...\n\nYour email will include:\n📧 Detailed coverage breakdown\n📊 Premium calculation\n📜 Islamic compliance certificate\n📋 Policy application\n📞 Direct contact information\n🔒 Secure payment portal link\n\nExpected delivery: 2-3 minutes\nQuote reference: ${quoteRef}\n\nAlhamdulillah! Thank you for choosing Takaful for your home protection needs.`
          );
          break;
        default:
          addAssistantMessage('Thanks! We will follow up shortly.');
      }

      setShowFinalOptions(false);
      setAwaitingUser(false);
    }, 900);
  };

  const startConversation = () => {
    setShowWelcome(false);
    setTimeout(() => setConversationStep(0), 500);
  };

  useEffect(() => {
    if (!showWelcome && !isProcessing) processNextStep();
  }, [conversationStep, showWelcome]);

  // Debug utilities for development
  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      // Add debugging functions to window for manual testing
      (window as any).debugQuote = () => {
        console.log('=== QUOTE GENERATION DEBUG ===');
        console.log('User Data:', userData);
   
      };

      (window as any).testApi = async () => {
 
        
        try {
          // Test user registration
          const testUserPayload: RegisterUserRequestSchema = {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            phone_number: '+1234567890'
          };
          
      
          const userResult = await registerUser(testUserPayload);
       
          
          // Test property creation
          const testPropertyPayload: PropertyCreateRequestSchema = {
            user_id: userResult.user_id,
            street_address: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zip_code: '12345',
            construction_year: 2000,
            home_value: 300000,
            square_footage: 1500,
            property_type: 'single_family',
            construction_material: 'frame',
            roof_type: 'composition_shingle',
            foundation_type: 'slab',
            stories: 1,
            bedrooms: 3,
            bathrooms: 2,
            garage: true,
            pool: false
          };
          
         
          const propertyResult = await createProperty(testPropertyPayload);
       
          
          // Test quote creation
          const testQuotePayload: QuoteCreateRequestSchema = {
            property_id: propertyResult.property.property_id,
            user_id: userResult.user_id,
            dwelling_limit: 360000,
            deductible: 1000,
            safety_discount: "0.0",
            status: 'draft'
          };
          
       
          const quoteResult = await createQuote(testQuotePayload);
         
          
        } catch (error) {
          console.error('REAL API: Test Failed:', error);
        }
      };

     
    }
  }, []);

  if (showWelcome) {
    return (
      <MainLayout>
        <WelcomeScreen onStart={startConversation} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ChatInterface
        messages={messages}
        conversationStep={conversationStep}
        userData={userData}
        awaitingUser={awaitingUser}
        showTyping={showTyping}
        onUserResponse={handleUserResponse}
        onFinalAction={handleFinalAction}
        progressTexts={progressTexts}
        conversationFlow={conversationFlow}
        showFinalOptions={showFinalOptions}
        canSendMessage={canSendMessage}
        validationErrors={validationErrors}
        onGoBack={goBackToStep}
        stepHistory={stepHistory}
      />
    </MainLayout>
  );
};

export default QuoteApplication;