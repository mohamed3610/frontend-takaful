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

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email || typeof email !== 'string') return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    
    // Check for period immediately before @
    if (email.includes('.@')) return 'Email cannot have a period immediately before the @-sign';
    
    // Check for period immediately after @
    if (email.includes('@.')) return 'Email cannot have a period immediately after the @-sign';
    
    // Check for consecutive periods
    if (email.includes('..')) return 'Email cannot contain consecutive periods';
    
    // Check if starts with period
    if (email.startsWith('.')) return 'Email cannot start with a period';
    
    return null;
  };

  const validateName = (name: string, fieldName: string): string | null => {
    if (!name || typeof name !== 'string') return `${fieldName} is required`;
    
    // Remove invalid characters like backslashes
    const invalidChars = /[\\\/\<\>\{\}\[\]]/;
    if (invalidChars.test(name)) {
      return `${fieldName} contains invalid characters (\\, /, <, >, {, }, [, ])`;
    }
    
    const trimmed = name.trim();
    if (trimmed.length === 0) return `${fieldName} cannot be empty`;
    if (trimmed.length < 2) return `${fieldName} must be at least 2 characters`;
    
    return null;
  };

  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone || typeof phone !== 'string') return 'Phone number is required';
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) return 'Phone number must have at least 10 digits';
    if (digitsOnly.length > 15) return 'Phone number is too long';
    
    return null;
  };

  const validateUserData = (): string[] => {
    const errors: string[] = [];
    
    // Validate email
    const emailError = validateEmail(userData.email);
    if (emailError) errors.push(emailError);
    
    // Validate full name
    const fullName = userData.full_name || userData.name || '';
    const nameError = validateName(fullName, 'Full name');
    if (nameError) errors.push(nameError);
    
    // If we have separate first/last names, validate those too
    const [firstName, ...rest] = (fullName || '').trim().split(/\s+/);
    const lastName = rest.join(' ') || firstName || '';
    
    const firstNameError = validateName(firstName, 'First name');
    if (firstNameError) errors.push(firstNameError);
    
    if (lastName && lastName !== firstName) {
      const lastNameError = validateName(lastName, 'Last name');
      if (lastNameError) errors.push(lastNameError);
    }
    
    // Validate phone number
    const phoneError = validatePhoneNumber(userData.phone_number);
    if (phoneError) errors.push(phoneError);
    
    return errors;
  };

  const sanitizeUserData = () => {
    const sanitized = { ...userData };
    
    // Clean email
    if (sanitized.email) {
      sanitized.email = String(sanitized.email).trim().toLowerCase();
    }
    
    // Clean names - remove invalid characters
    if (sanitized.full_name) {
      sanitized.full_name = String(sanitized.full_name)
        .replace(/[\\\/\<\>\{\}\[\]]/g, '')
        .trim();
    }
    
    // Clean phone number
    if (sanitized.phone_number) {
      const cleaned = String(sanitized.phone_number).replace(/\D/g, '');
      sanitized.phone_number = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;
    }
    
    return sanitized;
  };

  const addAssistantMessage = (content: string, step?: any, extra?: any) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'assistant', content, step, ...(extra || {}) }
    ]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content }]);
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

  const processNextStep = () => {
    const step = conversationFlow[conversationStep];
    if (!step) return;

    setIsProcessing(true);
    setShowTyping(true);
    setAwaitingUser(false);

    const messageText = typeof step.message === 'function' ? step.message(getFriendlyName()) : step.message;

    setTimeout(() => {
      addAssistantMessage(messageText, step);
      setShowTyping(false);

      if (step.type === 'loading' || step.id === 'generate_quote') {
        // Validate user data before making API calls
        const errors = validateUserData();
        if (errors.length > 0) {
          setValidationErrors(errors);
          setCanSendMessage(false);
          addErrorMessage(errors);
          setAwaitingUser(true);
          setIsProcessing(false);
          return;
        }

        // Clear any previous errors
        setValidationErrors([]);
        setCanSendMessage(true);

        // Call backend APIs to register user, create property, and create quote
        (async () => {
          try {
            const sanitizedData = sanitizeUserData();
            
            // 1) Register or upsert user
            const fullName: string = sanitizedData.full_name || '';
            const [firstName, ...rest] = (fullName || '').trim().split(/\s+/);
            const lastName = rest.join(' ') || firstName || 'User';
            
            const userRes = await registerUser({
              email: sanitizedData.email,
              first_name: firstName || 'User',
              last_name: lastName || 'User',
              phone_number: sanitizedData.phone_number || '+10000000000',
            });

            const userId = userRes.user_id;

            // Helpers: map UI fields to API enums/fields
            const mapPropertyType = (v: string | undefined) => {
              switch (v) {
                case 'single_family':
                  return 'single_family';
                case 'townhouse':
                  return 'townhouse';
                case 'apartment':
                case 'condo':
                  return 'condo';
                case 'duplex':
                  return 'single_family';
                default:
                  return 'single_family';
              }
            };

            const mapConstructionMaterial = (v: string | undefined) => {
              switch (v) {
                case 'frame':
                  return 'frame';
                case 'masonry':
                  return 'masonry';
                case 'steel':
                  return 'steel';
                case 'mixed':
                case 'other':
                  return 'other';
                default:
                  return 'frame';
              }
            };

            const mapFoundation = (v: string | undefined) => {
              switch (v) {
                case 'slab':
                  return 'slab';
                case 'basement':
                  return 'basement';
                case 'crawl_space':
                  return 'crawl_space';
                case 'pier_post':
                case 'pier_beam':
                  return 'pier_beam';
                default:
                  return 'slab';
              }
            };

            const mapGarage = (v: string | undefined) => (v && v !== 'none' ? true : false);
            const mapPool = (v: string | undefined) => (v && v !== 'none' ? true : false);

            const storiesStr = String(sanitizedData.stories || '1');
            const stories = parseInt(storiesStr === '3' ? '3' : storiesStr, 10) || 1;

            // 2) Create property
            const propertyPayload: PropertyCreateRequestSchema = {
              user_id: userId,
              street_address: String(sanitizedData.street_address || '').trim(),
              city: String(sanitizedData.city || '').trim(),
              state: String(sanitizedData.state || '').trim(),
              zip_code: String(sanitizedData.zip_code || '').trim(),
              construction_year: parseInt(String(sanitizedData.construction_year || new Date().getFullYear()), 10),
              home_value: parseInt(String(sanitizedData.home_value || '300000'), 10),
              square_footage: parseInt(String(sanitizedData.square_footage || '1500'), 10),
              property_type: mapPropertyType(sanitizedData.property_type) as any,
              construction_material: mapConstructionMaterial(sanitizedData.construction_material) as any,
              roof_type: (sanitizedData.roof_type || 'composition_shingle') as any,
              foundation_type: mapFoundation(sanitizedData.foundation_type) as any,
              stories: stories,
              bedrooms: sanitizedData.bedrooms ? parseInt(String(sanitizedData.bedrooms), 10) : null,
              bathrooms: sanitizedData.bathrooms ? parseInt(String(sanitizedData.bathrooms), 10) : null,
              garage: mapGarage(sanitizedData.garage),
              pool: mapPool(sanitizedData.pool),
            };

            const propertyRes = await createProperty(propertyPayload);

            // 3) Create quote
            const homeValueNum = propertyPayload.home_value;
            const dwellingLimit = Math.min(Math.round(homeValueNum * 1.2), homeValueNum + 100000);
            const deductible = parseInt(String(sanitizedData.deductible || '1000'), 10);

            const quotePayload: QuoteCreateRequestSchema = {
              property_id: propertyRes.property.property_id,
              user_id: userId,
              dwelling_limit: dwellingLimit,
              deductible: deductible,
            };

            const quoteRes = await createQuote(quotePayload);

            // Build UI-friendly quote summary
            const total = parseFloat(quoteRes.total_premium);
            const monthly = Math.round(total / 12);
            const normalizedQuote = {
              monthly,
              annual: Math.round(total),
              dwelling_limit: quoteRes.quote_version.dwelling_limit,
              discounts: quoteRes.quote_version.discounts || [],
            };

            addAssistantMessage('quote_result', step, { quote: normalizedQuote });
          } catch (e) {
            console.error('Failed to create quote via API:', e);
            let errorMessage = 'Sorry, I could not generate a quote right now. Please try again.';
            
            // Handle specific API errors
            if (e instanceof Error) {
              if (e.message.includes('email')) {
                errorMessage = 'There was an issue with the email address. Please check it and try again.';
              } else if (e.message.includes('name')) {
                errorMessage = 'There was an issue with the name fields. Please check for invalid characters.';
              }
            }
            
            addAssistantMessage(errorMessage);
          }

          // After showing the loading and quote message, open final options in chat
          setTimeout(() => {
            setConversationStep(conversationFlow.length);
            setAwaitingUser(true);
            setIsProcessing(false);
            setShowFinalOptions(true);
          }, 1500);
        })();
      } else {
        setAwaitingUser(true);
        setIsProcessing(false);
      }
    }, 800);
  };

  const handleUserResponse = (value: any, step: any) => {
    if (isProcessing || !canSendMessage) return;

    const isSelection = value && typeof value === 'object' && 'text' in value && 'value' in value;
    const messageContent = isSelection ? value.text : (typeof value === 'string' ? value : value.text || value);
    addUserMessage(messageContent);

    // Real-time validation for specific fields
    if (step?.field) {
      const storedValue = isSelection ? value.value : messageContent;
      
      // Validate email field in real-time
      if (step.field === 'email') {
        const emailError = validateEmail(storedValue);
        if (emailError) {
          addAssistantMessage(`I notice there's an issue with that email: ${emailError}. Please provide a valid email address.`);
          return;
        }
      }
      
      // Validate name fields in real-time
      if (['full_name', 'name'].includes(step.field)) {
        const nameError = validateName(storedValue, 'Name');
        if (nameError) {
          addAssistantMessage(`I notice there's an issue with that name: ${nameError}. Please provide a valid name.`);
          return;
        }
      }
      
      // Validate phone number in real-time
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

    setTimeout(() => {
      setConversationStep(prev => prev + 1);
    }, 800);
  };

  const handleFinalAction = (action: string) => {
    // Show assistant response for each final action
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

      // After responding, keep final options hidden
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
      />
    </MainLayout>
  );
};

export default QuoteApplication;