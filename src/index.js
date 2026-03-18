/**
 * GoPag SDK - Card tokenization via Zoop API
 * Maintains PCI DSS compliance by tokenizing sensitive data in the browser
 */

class GoPagSDK {
  /**
   * @param {Object} config - SDK configuration
   * @param {string} config.publishableKey - Zoop public key
   * @param {string} config.marketplaceId - Zoop marketplace ID
   * @param {string} config.environment - 'production' or 'sandbox'
   * @param {boolean} config.enable3DS - Enable 3D Secure (default: false)
   * @param {string} config.recaptchaSiteKey - reCAPTCHA key (optional)
   */
  constructor(config = {}) {
    this.publishableKey = config.publishableKey;
    this.marketplaceId = config.marketplaceId;
    this.environment = config.environment || 'production';
    this.enable3DS = config.enable3DS || false;
    this.recaptchaSiteKey = config.recaptchaSiteKey;
    
    // Zoop API URLs
    this.apiUrls = {
      production: 'https://api.zoop.ws/v1',
      sandbox: 'https://api.zoop.ws/v1'
    };
    
    this.baseUrl = this.apiUrls[this.environment] || this.apiUrls.production;
    
    if (!this.publishableKey) {
      console.warn('GoPagSDK: publishableKey not provided. Configure before using.');
    }
    
    if (!this.marketplaceId) {
      console.warn('GoPagSDK: marketplaceId not provided. Configure before using.');
    }
  }

  /**
   * Validates card data
   * @private
   */
  _validateCardData(cardData) {
    const required = ['holder_name', 'expiration_month', 'expiration_year', 'card_number', 'security_code'];
    const missing = required.filter(field => !cardData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Required fields missing: ${missing.join(', ')}`);
    }

    // Basic card number validation (Luhn algorithm)
    if (!this._isValidCardNumber(cardData.card_number)) {
      throw new Error('Invalid card number');
    }

    // Month validation
    const month = parseInt(cardData.expiration_month, 10);
    if (month < 1 || month > 12) {
      throw new Error('Invalid expiration month');
    }

    // Year validation
    const year = parseInt(cardData.expiration_year, 10);
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 20) {
      throw new Error('Invalid expiration year');
    }

    return true;
  }

  /**
   * Luhn algorithm to validate card number
   * @private
   */
  _isValidCardNumber(cardNumber) {
    const sanitized = cardNumber.replace(/\s+/g, '');
    
    if (!/^\d+$/.test(sanitized)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return (sum % 10) === 0;
  }

  /**
   * Encodes values to Base64 (UTF-8 safe)
   * @private
   * @param {Object|string} value - Value to encode
   * @returns {string} Base64 string
   */
  _toBase64(value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (typeof btoa === 'function') {
      return btoa(unescape(encodeURIComponent(stringValue)));
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(stringValue, 'utf-8').toString('base64');
    }

    throw new Error('Base64 encoding is not supported in this environment');
  }

  /**
   * Tokenizes credit card data via Zoop API
   * @param {Object} cardData - Card data
   * @param {string} cardData.holder_name - Cardholder name
   * @param {string} cardData.expiration_month - Expiration month (MM)
   * @param {string} cardData.expiration_year - Expiration year (YYYY)
   * @param {string} cardData.card_number - Card number
   * @param {string} cardData.security_code - CVV
   * @returns {Promise<Object>} Card token
   */
  async tokenizeCard(cardData) {
    try {
      if (!this.publishableKey) {
        throw new Error('publishableKey not configured');
      }

      if (!this.marketplaceId) {
        throw new Error('marketplaceId not configured');
      }

      // Validate card data
      this._validateCardData(cardData);

      // Prepare data for submission
      const payload = {
        holder_name: cardData.holder_name,
        expiration_month: cardData.expiration_month,
        expiration_year: cardData.expiration_year,
        card_number: cardData.card_number.replace(/\s+/g, ''),
        security_code: cardData.security_code
      };

      // Make request to Zoop API
      const response = await fetch(`${this.baseUrl}/marketplaces/${this.marketplaceId}/cards/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(this.publishableKey + ':')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Error tokenizing card');
      }
      
      return {
        success: true,
        token: result.id,
        card: {
          id: result.card?.id,
          first4: result.card?.first4_digits,
          last4: result.card?.last4_digits,
          brand: result.card?.card_brand,
          expiration_month: result.card?.expiration_month,
          expiration_year: result.card?.expiration_year,
          holder_name: result.card?.holder_name,
          is_valid: result.card?.is_valid,
          is_verified: result.card?.is_verified,
          fingerprint: result.card?.fingerprint
        },
        resource: result.resource,
        type: result.type,
        used: result.used,
        uri: result.uri,
        created_at: result.created_at,
        updated_at: result.updated_at,
        raw: result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Gets data for 3D Secure (3DS)
   * Collects browser fingerprint data for fraud prevention
   * @param {Object} options - Options for 3DS
   * @returns {Promise<Object>} 3DS browser data
   */
  async get3DSDeviceData(options = {}) {
    try {
      if (!this.enable3DS) {
        return {
          success: true,
          enabled: false,
          message: '3D Secure not enabled'
        };
      }

      // Collect browser fingerprint data
      const device = {
        color_depth: screen.colorDepth,
        type: 'BROWSER',
        java_enabled: navigator.javaEnabled(),
        language: navigator.language || navigator.userLanguage,
        screen_height: screen.height,
        screen_width: screen.width,
        time_zone_offset: new Date().getTimezoneOffset() / 60
      };

      return {
        success: true,
        enabled: true,
        device,
        raw: device
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Gets billing data for 3D Secure (3DS)
   * @param {Object} billingData - Billing information
   * @param {string} billingData.address - Billing address
   * @param {string} billingData.city - City
   * @param {string} billingData.postal_code - Postal/ZIP code
   * @param {string} billingData.state - State (2-letter code)
   * @param {string} billingData.country - Country (2-letter code, default: 'br')
   * @param {string} billingData.email_address - Email address
   * @param {string|number} billingData.phone_number - Phone number
   * @returns {Promise<Object>} 3DS billing data
   */
  async get3DSBillingData(billingData = {}) {
    try {
      if (!this.enable3DS) {
        return {
          success: true,
          enabled: false,
          message: '3D Secure not enabled'
        };
      }

      // Validate required fields
      const required = ['address', 'city', 'postal_code', 'state', 'email_address', 'phone_number'];
      const missing = required.filter(field => !billingData[field]);
      
      if (missing.length > 0) {
        throw new Error(`Required billing fields missing: ${missing.join(', ')}`);
      }

      // Prepare billing data
      const billing = {
        address: billingData.address,
        city: billingData.city,
        postal_code: billingData.postal_code,
        state: billingData.state.toLowerCase(),
        country: (billingData.country || 'br').toLowerCase(),
        email_address: billingData.email_address,
        phone_number: typeof billingData.phone_number === 'string' 
          ? parseInt(billingData.phone_number.replace(/\D/g, ''), 10)
          : billingData.phone_number
      };

      return {
        success: true,
        enabled: true,
        billing,
        raw: billing
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Gets complete 3D Secure data (device + billing)
   * @param {Object} options - Options for 3DS
   * @param {Object} options.billing - Billing data object
   * @returns {Promise<Object>} Complete 3DS data
   */
  async get3DSData(options = {}) {
    try {
      if (!this.enable3DS) {
        return {
          success: true,
          enabled: false,
          message: '3D Secure not enabled'
        };
      }

      // Get device data
      const deviceResult = await this.get3DSDeviceData(options);
      
      if (!deviceResult.success) {
        throw new Error(`Failed to get device data: ${deviceResult.error}`);
      }

      // Get billing data (if provided)
      let billingResult = { success: true, enabled: false };
      
      if (options.billing) {
        billingResult = await this.get3DSBillingData(options.billing);
        
        if (!billingResult.success) {
          throw new Error(`Failed to get billing data: ${billingResult.error}`);
        }
      }

      // Combine device and billing data
      const three_d_secure = {
        user_agent: navigator.userAgent,
        chanllenge_type: "DATA_ONLY",
        device: deviceResult.device
      };

      if (billingResult.enabled && billingResult.billing) {
        three_d_secure.billing = billingResult.billing;
      }

      return {
        success: true,
        enabled: true,
        three_d_secure,
        raw: three_d_secure
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Tokenizes reCAPTCHA for fraud prevention
   * @param {string} action - reCAPTCHA action (e.g., 'tokenize_card')
   * @returns {Promise<Object>} reCAPTCHA token
   */
  async tokenizeRecaptcha(action = 'tokenize_card') {
    try {
      if (!this.recaptchaSiteKey) {
        return {
          success: true,
          enabled: false,
          message: 'reCAPTCHA not configured'
        };
      }

      // Check if grecaptcha is available
      if (typeof grecaptcha === 'undefined' || !grecaptcha.execute) {
        throw new Error('Google reCAPTCHA not loaded. Include the script: https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY');
      }

      // Execute reCAPTCHA v3
      const token = await grecaptcha.execute(this.recaptchaSiteKey, { action });
      return {
        success: true,
        enabled: true,
        token,
        action
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Main method that wraps complete tokenization
   * @param {Object} cardData - Card data
   * @param {Object} options - Additional options
   * @param {Object} options.billing - Billing data for 3DS
   * @param {string} options.recaptchaAction - reCAPTCHA action
   * @returns {Promise<Object>} Complete tokenization result
   */
  async tokenize(cardData, options = {}) {
    try {
      const startTime = Date.now();
      
      // 1. Tokenize reCAPTCHA (if enabled)
      const recaptchaResult = await this.tokenizeRecaptcha(options.recaptchaAction);
      
      if (recaptchaResult.enabled && !recaptchaResult.success) {
        throw new Error(`reCAPTCHA failed: ${recaptchaResult.error}`);
      }

      // 2. Tokenize card
      const cardResult = await this.tokenizeCard(cardData);
      
      if (!cardResult.success) {
        throw new Error(`Card tokenization failed: ${cardResult.error}`);
      }

      // 3. Get 3DS data (if enabled)
      let threeDSResult = { success: true, enabled: false };
      
      if (this.enable3DS) {
        threeDSResult = await this.get3DSData(options);
      }

      // Consolidated result
      const result = {
        success: true,
        processingTime: Date.now() - startTime,
        card: {
          token: cardResult.token,
          ...cardResult.card
        },
        recaptcha: recaptchaResult.enabled ? {
          token: recaptchaResult.token,
          action: recaptchaResult.action
        } : null,
        three_d_secure: threeDSResult.enabled ? threeDSResult.three_d_secure : null
      };

      result.pciTokenSdk = this._toBase64(result);

      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Utility to format card number
   * @param {string} cardNumber - Card number
   * @returns {string} Formatted number
   */
  static formatCardNumber(cardNumber) {
    return cardNumber.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim();
  }

  /**
   * Utility to detect card brand
   * @param {string} cardNumber - Card number
   * @returns {string} Card brand
   */
  static detectCardBrand(cardNumber) {
    const sanitized = cardNumber.replace(/\s+/g, '');
    
    const patterns = {
      // Order matters: check more specific patterns first
      elo: /^(4011(78|79)|43(1274|8935)|45(1416|7393|763(1|2))|50(4175|6699|67[0-7]\d|9000)|627780|63(6297|6368)|650(03[^4]|04[8-9]|05[0-1]|4(0[5-9]|3[0-9]|8[5-9]|9[0-9])|5([0-3]\d|5[0-8]|9[0-8])|7(0[0-9]|1[0-8]|2[0-7])|9([0-4]\d|5[0-5]|87|9[0-8]))|6516(5[2-9]|[6-7]\d)|6550([0-1]\d|2[1-5]|5[0-8]))/,
      hipercard: /^(606282|637095|637568|637599|637609|637612)/,
      aura: /^50\d{14,17}$/,
      cabal: /^(60420[1-9]|6042[1-9]\d|6043[0-9]\d|604400)/,
      banescard: /^(603182|603193)/,
      amex: /^3[47]/,
      diners: /^3(?:0[0-5]|[68])/,
      discover: /^6(?:011|5)/,
      jcb: /^35/,
      mastercard: /^5[1-5]/,
      visa: /^4/
    };

    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(sanitized)) {
        return brand;
      }
    }

    return 'unknown';
  }
}

// Exports for different environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoPagSDK;
}

if (typeof window !== 'undefined') {
  window.GoPagSDK = GoPagSDK;
}

export default GoPagSDK;
