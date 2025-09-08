import React, { useState, useEffect } from 'react';
import MainLayout from './MainLayout';
import ChatInterface from './ChatInterface';
import WelcomeScreen from './WelcomeScreen';
import { conversationFlow, progressTexts } from '../../data/ConversationFlow';
import "../../styles/quote.css";
import { registerUser } from '../../api/auth';
import { createProperty } from '../../api/property';
import { createQuote } from '../../api/quote';
import type { PropertyCreateRequestSchema, QuoteCreateRequestSchema } from '../../api/schemas';
import { flushSync } from "react-dom";

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
  // Add a counter for unique message IDs
  const [messageIdCounter, setMessageIdCounter] = useState(0);

  // Debug logging for development
  useEffect(() => {
    if ((import.meta as any).env?.DEV) {
      console.log('Current userData:', userData);
      console.log('Current step:', conversationStep);
      console.log('API Base URL:', (import.meta as any).env?.VITE_API_BASE_URL);
    }
  }, [userData, conversationStep]);

  // Fixed message functions with unique IDs
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

  // Mock email verification function (replace with real API call)
  const verifyEmailExists = async (email: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For testing: only these emails exist in the system
    const existingEmails = ['test@example.com', 'ahmed@takaful.com', 'user@test.com'];
    return existingEmails.includes(email.toLowerCase());
  };

  // Mock validation functions (you'll need to implement these based on your requirements)
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

  const validateUserData = (): string[] => {
    const errors: string[] = [];
    
    if (!userData.full_name) errors.push('Full name is required');
    if (!userData.email) errors.push('Email is required');
    if (!userData.phone_number) errors.push('Phone number is required');
    
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


// Fixed handleEmailVerification function
const handleEmailVerification = async () => {
  try {
    console.log("=== EMAIL VERIFICATION START ===");
    console.log("Checking email:", userData.email);

    // Show verification in progress message
    addAssistantMessage("🔍 Checking if this email exists in our system...");

    const emailExists = await verifyEmailExists(userData.email);
    console.log("Email exists result:", emailExists);

    // Clear typing and processing states first
    setShowTyping(false);
    setIsProcessing(false);

    if (emailExists) {
      // ✅ Email found - navigate to OTP step
      setUserData((prev) => ({
        ...prev,
        email_verified: true,
        email_not_found: false,
      }));

      // Add success message
      addAssistantMessage("✅ Great! I found your account. Let me send you a verification code.");

      // Navigate to OTP step after a short delay
      setTimeout(() => {
        const otpStepIndex = conversationFlow.findIndex(
          (step) => step.id === "send_otp"
        );
        if (otpStepIndex !== -1) {
          console.log("Navigating to OTP step:", otpStepIndex);
          setConversationStep(otpStepIndex);
          // Force processNextStep to run for OTP step
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

        // Add both message and options in a single call
        setTimeout(() => {
          if (messageText) {
            // Pass the step with options so ChatInterface can render both message and options together
            addAssistantMessage(messageText, step);
          }
          
          setConversationStep(emailNotFoundStepIndex);
          setAwaitingUser(true);
          setIsProcessing(false);
          setShowTyping(false);
        }, 800);

      } else {
        // fallback if step not found
        addAssistantMessage(
          "❌ I couldn't find an account with that email address. Please try a different email or continue as a new customer."
        );
        setIsProcessing(false);
        setAwaitingUser(true);
      }
    }
  } catch (error) {
    console.error("Email verification failed:", error);
    addAssistantMessage(
      "⚠️ Sorry, I couldn't verify the email right now due to a technical issue.\n\n" +
        "Please try again in a moment, or contact our support team if the problem persists."
    );
    setIsProcessing(false);
    setShowTyping(false);
    setAwaitingUser(true);
  }
};

// Fixed processNextStep function
const processNextStep = () => {
  if (awaitingUser) {
    console.log("Already awaiting user input, skipping processNextStep");
    return;
  }

  if (isProcessing) {
    console.log("Already processing, skipping processNextStep");
    return;
  }

  updateStepHistory(conversationStep);

  let nextStepIndex = conversationStep;
  let step;

  console.log("=== PROCESSING NEXT STEP ===");
  console.log("Current step index:", nextStepIndex);
  console.log("Current userData:", userData);

  step = conversationFlow[nextStepIndex];

  // Special handling for send_otp step - bypass condition check
  if (step && step.id === "send_otp") {
    console.log("Direct navigation to send_otp step, bypassing condition check");
  } else {
    // Normal condition checking for other steps
    do {
      step = conversationFlow[nextStepIndex];
      if (!step) {
        console.log("No more steps found");
        return;
      }

      console.log("Checking step:", step.id, "condition:", !!step.condition);

      if (step.condition && !step.condition(userData)) {
        console.log("Step condition failed for:", step.id);
        nextStepIndex++;
        continue;
      }

      console.log("Step condition passed for:", step.id);
      break;
    } while (nextStepIndex < conversationFlow.length);
  }

  if (!step) {
    console.log("No valid step found");
    return;
  }

  console.log("Processing step:", step.id, "type:", step.type);
  setIsProcessing(true);
  setShowTyping(true);
  setAwaitingUser(false);

  const messageText =
    typeof step.message === "function" ? step.message(getFriendlyName()) : step.message;

  setTimeout(() => {
    setShowTyping(false);

    // Handle different step types
    if (step.type === "options" && step.options?.length > 0) {
      // For options steps, show message and wait for user selection
      if (messageText) {
        addAssistantMessage(messageText, step);
      }
      setAwaitingUser(true);
      setIsProcessing(false);
      return;

    } else if (step.type === "loading") {
      // Handle loading steps
      if (step.id === "generate_quote") {
        if (messageText) addAssistantMessage(messageText, step);
        handleQuoteGeneration(step);
      } else if (step.id === "email_verification_check") {
        console.log("Starting email verification step");
        if (messageText) addAssistantMessage(messageText, step);
        handleEmailVerification();
      } else {
        console.log("Other loading step:", step.id);
        if (messageText) addAssistantMessage(messageText, step);
        setAwaitingUser(true);
        setIsProcessing(false);
      }

    } else if (step.id === "send_otp") {
      // Special handling for OTP step
      console.log("Starting OTP step");
      if (messageText) addAssistantMessage(messageText, step);
      handleOTPSending();

    } else {
      // Regular input/text steps
      console.log("Regular step, waiting for user:", step.id);
      if (messageText) addAssistantMessage(messageText, step);
      setAwaitingUser(true);
      setIsProcessing(false);
    }
  }, 800);
};
  



  const handleOTPSending = async () => {
    // Check if OTP step was already handled manually to prevent duplicates
    if (userData.otp_step_handled) {
      console.log('OTP step already handled manually, skipping automatic OTP sending');
      return;
    }
    
    // Static simulation for testing OTP flow only
    console.log('Simulating OTP send to:', userData.email);
    
    // Show a static message that OTP was "sent"
    setTimeout(() => {
      addAssistantMessage("📧 Verification code sent! For testing, use: 123456");
      setAwaitingUser(true);
      setIsProcessing(false);
    }, 1000);
  };

  const verifyOTP = async (otpCode: string) => {
    setIsProcessing(true);
    setShowTyping(true);
    
    // Static verification for testing OTP flow only - accept "123456" as valid
    const isValidOTP = otpCode === '123456';
    
    setTimeout(() => {
      setShowTyping(false);
      
      if (isValidOTP) {
        // Simulate loading user data for existing customer (static for testing)
        const simulatedUserData = {
          full_name: 'Ahmed Hassan',
          phone_number: '+1234567890',
          otp_verified: true
        };
        
        setUserData(prev => ({...prev, ...simulatedUserData}));
        
        addAssistantMessage("Perfect! You're now logged in. 🎉");
        
        // Navigate to the welcome back step with proper step processing
        setTimeout(() => {
          const welcomeBackStepIndex = conversationFlow.findIndex(step => step.id === 'existing_welcome_back');
          if (welcomeBackStepIndex !== -1) {
            setConversationStep(welcomeBackStepIndex);
          } else {
            // Fallback: move to next logical step
            setConversationStep(prev => prev + 1);
          }
        }, 800);
      } else {
        addAssistantMessage("The verification code doesn't match. Please use: 123456 for testing.");
        setAwaitingUser(true);
      }
      
      setIsProcessing(false);
    }, 1500);
  };

  // Enhanced go back functionality with proper state management
  const goBackToStep = (targetStepIndex: number) => {
    console.log('=== GO BACK FUNCTIONALITY ===');
    console.log('Target step index:', targetStepIndex);
    console.log('Current step:', conversationStep);
    console.log('Current userData before going back:', userData);
    
    if (targetStepIndex < 0 || targetStepIndex >= conversationFlow.length) {
      console.error('Invalid target step index:', targetStepIndex);
      return;
    }

    const targetStep = conversationFlow[targetStepIndex];
    if (!targetStep) {
      console.error('Target step not found:', targetStepIndex);
      return;
    }

    console.log('Going back to step:', targetStep.id);

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
        console.log('Clearing field from step', i, ':', step.field);
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
    
    // Only reset these fields if we're going back before they would be set
    fieldsToReset.forEach(field => {
      const fieldStepIndex = conversationFlow.findIndex(step => 
        step.id === 'email_verification_check' && field === 'email_verified' ||
        step.id === 'email_not_found' && field === 'email_not_found' ||
        step.id === 'send_otp' && field === 'otp_verified' ||
        step.id === 'send_otp' && field === 'otp_code' ||
        step.id === 'existing_welcome_back' && field === 'quote_type'
      );
      
      if (fieldStepIndex > targetStepIndex && updatedUserData[field] !== undefined) {
        console.log('Resetting field:', field);
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
  if (isProcessing || !canSendMessage) return;

  const isSelection = value && typeof value === 'object' && 'text' in value && 'value' in value;
  const messageContent = isSelection ? value.text : (typeof value === 'string' ? value : value.text || value);
  addUserMessage(messageContent);

  // Handle special cases for email_not_found step
  if (step?.id === 'email_not_found' && isSelection) {
    if (value.value === 'retry_email') {
      // Clear the email not found flag and go back to email input
      setUserData(prev => ({ 
        ...prev, 
        email_not_found: false,
        email: '' // Clear the previous email
      }));
      
      addAssistantMessage("No problem! Let's try with a different email address.");
      
      setTimeout(() => {
        const emailStepIndex = conversationFlow.findIndex(s => s.id === 'existing_login');
        setConversationStep(emailStepIndex);
      }, 800);
      return;
      
    } else if (value.value === 'continue_as_new') {
      // Set user as new customer and continue
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
      // Handle support contact
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
      
      // Stay on the same step to allow them to choose again
      setAwaitingUser(true);
      setIsProcessing(false);
      return;
    }
  }

  // Handle OTP verification (both from send_otp step AND manual email verification flow)
  if (step?.id === 'send_otp' || (userData.email_verified && awaitingUser && /^\d{6}$/.test(messageContent.trim()))) {
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

  // Update user data if step has a field
  if (step?.field) {
    const storedValue = isSelection ? value.value : messageContent;
    setUserData((prev: any) => ({ ...prev, [step.field]: storedValue }));
  }

  // Update step history before moving to next step
  updateStepHistory(conversationStep);

  // CRITICAL FIX: Reset awaitingUser state before moving to next step
  setAwaitingUser(false);
  setIsProcessing(false);

  setTimeout(() => {
    // Find next valid step index
    let nextStepIndex = conversationStep + 1;
    while (nextStepIndex < conversationFlow.length) {
      const nextStep = conversationFlow[nextStepIndex];
      if (!nextStep.condition || nextStep.condition({...userData, [step?.field]: isSelection ? value.value : messageContent})) {
        break;
      }
      nextStepIndex++;
    }
    
    setConversationStep(nextStepIndex);
  }, 800);
};
  // Simplified quote generation placeholder (add your full implementation here)
  const handleQuoteGeneration = (step: any) => {
    setTimeout(() => {
      addAssistantMessage("🎉 Your quote has been generated! Monthly premium: $125/month", step, { 
        quote: { monthly: 125, annual: 1500 } 
      });
      setShowFinalOptions(true);
      setAwaitingUser(true);
      setIsProcessing(false);
    }, 2000);
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
        console.log('Sanitized Data:', sanitizeUserData());
        console.log('Validation Errors:', validateUserData());
        console.log('Current Step:', conversationStep);
        console.log('API Base URL:', (import.meta as any).env?.VITE_API_BASE_URL);
        console.log('Environment:', (import.meta as any).env?.DEV ? 'Development' : 'Production');
      };

      (window as any).testApi = async () => {
        console.log('=== TESTING API ENDPOINTS ===');
        
        try {
          // Test user registration
          const testUserPayload = {
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            phone_number: '+1234567890'
          };
          
          console.log('Testing user registration...');
          const userResult = await registerUser(testUserPayload);
          console.log('User registration success:', userResult);
          
          // Test property creation
          const testPropertyPayload = {
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
          
          console.log('Testing property creation...');
          const propertyResult = await createProperty(testPropertyPayload);
          console.log('Property creation success:', propertyResult);
          
          // Test quote creation
          const testQuotePayload = {
            property_id: propertyResult.property.property_id,
            user_id: userResult.user_id,
            dwelling_limit: 360000,
            deductible: 1000
          };
          
          console.log('Testing quote creation...');
          const quoteResult = await createQuote(testQuotePayload);
          console.log('Quote creation success:', quoteResult);
          
        } catch (error) {
          console.error('API Test Failed:', error);
        }
      };

      console.log('Debug functions available: window.debugQuote() and window.testApi()');
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