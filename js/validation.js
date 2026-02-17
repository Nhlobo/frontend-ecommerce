/**
 * Form Validation Utilities for Premium Hair Wigs & Extensions E-commerce
 * Comprehensive client-side validation with security in mind
 */

/**
 * Validation rules and messages
 */
const VALIDATION_RULES = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    phone: {
        // South African phone format
        pattern: /^(\+27|0)[6-8][0-9]{8}$/,
        message: 'Please enter a valid South African phone number (e.g., 071 555 1234)'
    },
    postalCode: {
        // South African postal code (4 digits)
        pattern: /^\d{4}$/,
        message: 'Please enter a valid 4-digit postal code'
    },
    name: {
        pattern: /^[a-zA-Z\s'-]{2,50}$/,
        message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
    },
    username: {
        pattern: /^[a-zA-Z0-9_-]{3,20}$/,
        message: 'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens'
    },
    price: {
        pattern: /^\d+(\.\d{1,2})?$/,
        message: 'Please enter a valid price (e.g., 199.99)'
    },
    quantity: {
        pattern: /^[1-9]\d*$/,
        message: 'Quantity must be a positive number'
    }
};

/**
 * Validate email address
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, message: 'Email is required' };
    }
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0) {
        return { isValid: false, message: 'Email is required' };
    }
    
    if (trimmedEmail.length > 254) {
        return { isValid: false, message: 'Email is too long' };
    }
    
    if (!VALIDATION_RULES.email.pattern.test(trimmedEmail)) {
        return { isValid: false, message: VALIDATION_RULES.email.message };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate phone number
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, message: 'Phone number is required' };
    }
    
    // Remove spaces and dashes for validation
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    if (!VALIDATION_RULES.phone.pattern.test(cleanPhone)) {
        return { isValid: false, message: VALIDATION_RULES.phone.message };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate name (first name, last name, etc.)
 */
function validateName(name, fieldName = 'Name') {
    if (!name || typeof name !== 'string') {
        return { isValid: false, message: `${fieldName} is required` };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length < 2) {
        return { isValid: false, message: `${fieldName} must be at least 2 characters` };
    }
    
    if (trimmedName.length > 50) {
        return { isValid: false, message: `${fieldName} must be less than 50 characters` };
    }
    
    if (!VALIDATION_RULES.name.pattern.test(trimmedName)) {
        return { isValid: false, message: VALIDATION_RULES.name.message };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate postal code
 */
function validatePostalCode(code) {
    if (!code || typeof code !== 'string') {
        return { isValid: false, message: 'Postal code is required' };
    }
    
    const cleanCode = code.trim();
    
    if (!VALIDATION_RULES.postalCode.pattern.test(cleanCode)) {
        return { isValid: false, message: VALIDATION_RULES.postalCode.message };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate required field
 */
function validateRequired(value, fieldName = 'This field') {
    if (value === null || value === undefined || value === '') {
        return { isValid: false, message: `${fieldName} is required` };
    }
    
    if (typeof value === 'string' && value.trim().length === 0) {
        return { isValid: false, message: `${fieldName} is required` };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate minimum length
 */
function validateMinLength(value, minLength, fieldName = 'This field') {
    if (!value || typeof value !== 'string') {
        return { isValid: false, message: `${fieldName} is required` };
    }
    
    if (value.length < minLength) {
        return { isValid: false, message: `${fieldName} must be at least ${minLength} characters` };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate maximum length
 */
function validateMaxLength(value, maxLength, fieldName = 'This field') {
    if (value && typeof value === 'string' && value.length > maxLength) {
        return { isValid: false, message: `${fieldName} must be less than ${maxLength} characters` };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate numeric value
 */
function validateNumber(value, min = null, max = null, fieldName = 'This field') {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return { isValid: false, message: `${fieldName} must be a valid number` };
    }
    
    if (min !== null && num < min) {
        return { isValid: false, message: `${fieldName} must be at least ${min}` };
    }
    
    if (max !== null && num > max) {
        return { isValid: false, message: `${fieldName} must be at most ${max}` };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate price
 */
function validatePrice(price) {
    if (!price || typeof price === 'undefined') {
        return { isValid: false, message: 'Price is required' };
    }
    
    const priceStr = price.toString();
    
    if (!VALIDATION_RULES.price.pattern.test(priceStr)) {
        return { isValid: false, message: VALIDATION_RULES.price.message };
    }
    
    const priceNum = parseFloat(priceStr);
    
    if (priceNum <= 0) {
        return { isValid: false, message: 'Price must be greater than 0' };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate quantity
 */
function validateQuantity(quantity, maxStock = null) {
    if (!quantity) {
        return { isValid: false, message: 'Quantity is required' };
    }
    
    const quantityStr = quantity.toString();
    
    if (!VALIDATION_RULES.quantity.pattern.test(quantityStr)) {
        return { isValid: false, message: VALIDATION_RULES.quantity.message };
    }
    
    const quantityNum = parseInt(quantityStr);
    
    if (quantityNum < 1) {
        return { isValid: false, message: 'Quantity must be at least 1' };
    }
    
    if (maxStock !== null && quantityNum > maxStock) {
        return { isValid: false, message: `Only ${maxStock} items available in stock` };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate address
 */
function validateAddress(address) {
    const errors = [];
    
    // Validate street address
    if (!address.street || address.street.trim().length < 5) {
        errors.push('Street address must be at least 5 characters');
    }
    
    // Validate city
    if (!address.city || address.city.trim().length < 2) {
        errors.push('City is required');
    }
    
    // Validate province
    if (!address.province || address.province.trim().length < 2) {
        errors.push('Province is required');
    }
    
    // Validate postal code
    const postalCodeValidation = validatePostalCode(address.postalCode);
    if (!postalCodeValidation.isValid) {
        errors.push(postalCodeValidation.message);
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate credit card number (Luhn algorithm)
 * Note: For PCI DSS compliance, never store card numbers
 */
function validateCreditCard(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
        return { isValid: false, message: 'Card number is required' };
    }
    
    // Remove spaces and dashes
    const cleanNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Check if only digits
    if (!/^\d+$/.test(cleanNumber)) {
        return { isValid: false, message: 'Card number must contain only digits' };
    }
    
    // Check length (13-19 digits for most cards)
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
        return { isValid: false, message: 'Invalid card number length' };
    }
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber.charAt(i));
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    const isValid = sum % 10 === 0;
    
    return {
        isValid: isValid,
        message: isValid ? '' : 'Invalid card number'
    };
}

/**
 * Validate CVV
 */
function validateCVV(cvv) {
    if (!cvv || typeof cvv !== 'string') {
        return { isValid: false, message: 'CVV is required' };
    }
    
    const cleanCVV = cvv.trim();
    
    if (!/^\d{3,4}$/.test(cleanCVV)) {
        return { isValid: false, message: 'CVV must be 3 or 4 digits' };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Validate expiry date (MM/YY format)
 */
function validateExpiryDate(expiry) {
    if (!expiry || typeof expiry !== 'string') {
        return { isValid: false, message: 'Expiry date is required' };
    }
    
    const cleanExpiry = expiry.replace(/[\s/]/g, '');
    
    if (!/^\d{4}$/.test(cleanExpiry)) {
        return { isValid: false, message: 'Expiry date must be in MM/YY format' };
    }
    
    const month = parseInt(cleanExpiry.substring(0, 2));
    const year = parseInt('20' + cleanExpiry.substring(2, 4));
    
    if (month < 1 || month > 12) {
        return { isValid: false, message: 'Invalid expiry month' };
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return { isValid: false, message: 'Card has expired' };
    }
    
    return { isValid: true, message: '' };
}

/**
 * Show validation error on form field
 */
function showFieldError(fieldElement, message) {
    // Remove existing error
    removeFieldError(fieldElement);
    
    // Add error class
    fieldElement.classList.add('error');
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    // Insert after field
    fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
}

/**
 * Remove validation error from form field
 */
function removeFieldError(fieldElement) {
    fieldElement.classList.remove('error');
    
    const errorElement = fieldElement.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Validate entire form
 */
function validateForm(formElement, validationRules) {
    let isValid = true;
    const errors = [];
    
    // Clear all existing errors
    formElement.querySelectorAll('.error').forEach(el => {
        removeFieldError(el);
    });
    
    // Validate each field
    for (const [fieldName, rules] of Object.entries(validationRules)) {
        const field = formElement.querySelector(`[name="${fieldName}"]`);
        
        if (!field) continue;
        
        const value = field.value;
        
        // Check required
        if (rules.required) {
            const result = validateRequired(value, rules.label || fieldName);
            if (!result.isValid) {
                showFieldError(field, result.message);
                errors.push(result.message);
                isValid = false;
                continue;
            }
        }
        
        // Skip other validations if field is empty and not required
        if (!value && !rules.required) continue;
        
        // Check validation function
        if (rules.validate && typeof rules.validate === 'function') {
            const result = rules.validate(value);
            if (!result.isValid) {
                showFieldError(field, result.message);
                errors.push(result.message);
                isValid = false;
            }
        }
    }
    
    return {
        isValid: isValid,
        errors: errors
    };
}

/**
 * Real-time field validation
 */
function attachFieldValidation(fieldElement, validationFunction) {
    fieldElement.addEventListener('blur', function() {
        const result = validationFunction(this.value);
        
        if (!result.isValid) {
            showFieldError(this, result.message);
        } else {
            removeFieldError(this);
        }
    });
    
    // Clear error on input
    fieldElement.addEventListener('input', function() {
        if (this.classList.contains('error')) {
            removeFieldError(this);
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VALIDATION_RULES,
        validateEmail,
        validatePhone,
        validateName,
        validatePostalCode,
        validateRequired,
        validateMinLength,
        validateMaxLength,
        validateNumber,
        validatePrice,
        validateQuantity,
        validateAddress,
        validateCreditCard,
        validateCVV,
        validateExpiryDate,
        showFieldError,
        removeFieldError,
        validateForm,
        attachFieldValidation
    };
}
