# GoPag SDK

SDK JavaScript for credit card tokenization via Zoop API, maintaining PCI DSS compliance by processing sensitive data directly in the browser.

## 🚀 Features

- ✅ Secure credit card tokenization via Zoop API
- ✅ 3D Secure (3DS) with device fingerprinting and billing data support
- ✅ Google reCAPTCHA v3 integration
- ✅ Card validation with Luhn algorithm
- ✅ Automatic card brand detection
- ✅ Support for all Brazilian card brands (Visa, Mastercard, Elo, Hipercard, Aura, Cabal, Banescard, etc.)
- ✅ Compatible with all frameworks (Vanilla JS, jQuery, Vue, Angular, React)
- ✅ Available via NPM and local build
- ✅ PCI DSS compliant (sensitive data never passes through your server)

## 📦 Installation

### Via NPM

```bash
npm install js-gopag-sdk
```

### Via CDN

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/js-gopag-sdk/dist/gopag-sdk.umd.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/js-gopag-sdk/dist/gopag-sdk.umd.js"></script>
```

### Via Local Build

```html
<!-- Full version -->
<script src="./dist/gopag-sdk.umd.js"></script>

<!-- Minified version (recommended for production) -->
<script src="./dist/gopag-sdk.umd.min.js"></script>
```

## 🔧 Configuration

### JavaScript Vanilla / jQuery

```javascript
const gopag = new GoPagSDK({
  publishableKey: 'your_zoop_publishable_key',
  marketplaceId: 'your_zoop_marketplace_id', // Required
  environment: 'sandbox', // or 'production'
  enable3DS: true, // optional - enables browser fingerprinting
  recaptchaSiteKey: 'your_recaptcha_key' // optional
});
```

### ES6 / Module Bundlers (Webpack, Vite, etc.)

```javascript
import GoPagSDK from 'js-gopag-sdk';

const gopag = new GoPagSDK({
  publishableKey: 'your_zoop_publishable_key',
  marketplaceId: 'your_zoop_marketplace_id',
  environment: 'production'
});
```

### CommonJS (Node.js)

```javascript
const GoPagSDK = require('js-gopag-sdk');

const gopag = new GoPagSDK({
  publishableKey: 'your_zoop_publishable_key',
  marketplaceId: 'your_zoop_marketplace_id'
});
```

## 📖 Usage

### Main Method: `tokenize()`

The `tokenize()` method wraps all tokenization processes:

```javascript
const cardData = {
  holder_name: 'João da Silva',
  card_number: '4111111111111111',
  expiration_month: '12',
  expiration_year: '2025',
  security_code: '123'
};

const options = {
  billing: { // optional - for 3DS
    address: 'Rua Example, 123',
    city: 'Goiânia',
    postal_code: '74000-000',
    state: 'GO',
    country: 'BR',
    email_address: 'user@example.com',
    phone_number: '62991838359'
  },
  recaptchaAction: 'checkout' // optional - for reCAPTCHA
};

gopag.tokenize(cardData, options)
  .then(result => {
    if (result.success) {
      console.log('Card token:', result.card.token);
      console.log('Last 4 digits:', result.card.last4);
      console.log('Brand:', result.card.brand);
      console.log('3DS data:', result.three_d_secure); // Device + billing data if enabled
      
      // Send token to your server
      // The token replaces sensitive card data
    } else {
      console.error('Error:', result.error);
    }
  });
```

### Individual Methods

#### 1. `tokenizeCard(cardData)`

Tokenizes only card data:

```javascript
gopag.tokenizeCard({
  holder_name: 'João da Silva',
  card_number: '4111111111111111',
  expiration_month: '12',
  expiration_year: '2025',
  security_code: '123'
}).then(result => {
  if (result.success) {
    console.log('Token:', result.token);
    console.log('Card ID:', result.card.id);
    console.log('First 4 digits:', result.card.first4);
    console.log('Last 4 digits:', result.card.last4);
    console.log('Brand:', result.card.brand);
    console.log('Is valid:', result.card.is_valid);
    console.log('Fingerprint:', result.card.fingerprint);
  }
});
```

#### 2. `get3DSDeviceData()`

Collects browser fingerprint data for 3D Secure fraud prevention:

```javascript
gopag.get3DSDeviceData().then(result => {
  if (result.success && result.enabled) {
    console.log('Device Data:', result.device);
    // {
    //   device: "Mozilla/5.0...",
    //   colorDepth: 24,
    //   type: "BROWSER",
    //   javaEnabled: false,
    //   language: "pt-BR",
    //   screenHeight: 1080,
    //   screenWidth: 1920,
    //   timezoneOffset: 3
    // }
  }
});
```

#### 3. `get3DSBillingData(billingData)`

Collects and validates billing information for 3D Secure:

```javascript
gopag.get3DSBillingData({
  address: 'Rua Example, 123',
  city: 'Goiânia',
  postal_code: '74000-000',
  state: 'GO',
  country: 'BR', // optional, defaults to 'br'
  email_address: 'user@example.com',
  phone_number: '62991838359' // accepts string or number
}).then(result => {
  if (result.success && result.enabled) {
    console.log('Billing Data:', result.billing);
    // {
    //   address: "Rua Example, 123",
    //   city: "Goiânia",
    //   postal_code: "74000-000",
    //   state: "go",
    //   country: "br",
    //   email_address: "user@example.com",
    //   phone_number: 62991838359
    // }
  }
});
```

#### 4. `get3DSData(options)`

Collects complete 3D Secure data (device + billing):

```javascript
gopag.get3DSData({
  billing: {
    address: 'Rua Example, 123',
    city: 'Goiânia',
    postal_code: '74000-000',
    state: 'GO',
    email_address: 'user@example.com',
    phone_number: '62991838359'
  }
}).then(result => {
  if (result.success && result.enabled) {
    console.log('3DS Data:', result.three_d_secure);
    // {
    //   device: { ... },
    //   billing: { ... }
    // }
  }
});
```

#### 5. `tokenizeRecaptcha(action)`

Generates Google reCAPTCHA token:

```javascript
// Make sure to include the reCAPTCHA script
// <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

gopag.tokenizeRecaptcha('checkout').then(result => {
  if (result.success && result.enabled) {
    console.log('reCAPTCHA token:', result.token);
  }
});
```

## 🎨 Integration Examples

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Checkout with GoPag SDK</title>
  <script src="./dist/gopag-sdk.umd.min.js"></script>
</head>
<body>
  <form id="payment-form">
    <input type="text" id="cardholder-name" placeholder="Cardholder name" required>
    <input type="text" id="card-number" placeholder="Card number" required>
    <input type="text" id="expiry-month" placeholder="Month (MM)" required>
    <input type="text" id="expiry-year" placeholder="Year (YYYY)" required>
    <input type="text" id="cvv" placeholder="CVV" required>
    
    <!-- Billing fields for 3DS -->
    <input type="text" id="address" placeholder="Address" required>
    <input type="text" id="city" placeholder="City" required>
    <input type="text" id="postal-code" placeholder="Postal code" required>
    <input type="text" id="state" placeholder="State (2 letters)" required>
    <input type="email" id="email" placeholder="Email" required>
    <input type="tel" id="phone" placeholder="Phone" required>
    
    <button type="submit">Pay</button>
  </form>

  <script>
    const gopag = new GoPagSDK({
      publishableKey: 'zpk_test_xxxxx',
      marketplaceId: 'your_marketplace_id',
      environment: 'sandbox',
      enable3DS: true
    });

    document.getElementById('payment-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const cardData = {
        holder_name: document.getElementById('cardholder-name').value,
        card_number: document.getElementById('card-number').value,
        expiration_month: document.getElementById('expiry-month').value,
        expiration_year: document.getElementById('expiry-year').value,
        security_code: document.getElementById('cvv').value
      };

      const options = {
        billing: {
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          postal_code: document.getElementById('postal-code').value,
          state: document.getElementById('state').value,
          email_address: document.getElementById('email').value,
          phone_number: document.getElementById('phone').value
        }
      };

      const result = await gopag.tokenize(cardData, options);

      if (result.success) {
        // Send token and 3DS data to your server
        fetch('/api/process-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cardToken: result.card.token,
            three_d_secure: result.three_d_secure
          })
        });
      } else {
        alert('Error: ' + result.error);
      }
    });
  </script>
</body>
</html>
```

### React

```jsx
import React, { useState } from 'react';
import GoPagSDK from 'js-gopag-sdk';

const gopag = new GoPagSDK({
  publishableKey: process.env.REACT_APP_ZOOP_KEY,
  marketplaceId: process.env.REACT_APP_MARKETPLACE_ID,
  environment: 'production',
  enable3DS: true
});

function CheckoutForm() {
  const [cardData, setCardData] = useState({
    holder_name: '',
    card_number: '',
    expiration_month: '',
    expiration_year: '',
    security_code: ''
  });

  const [billingData, setBillingData] = useState({
    address: '',
    city: '',
    postal_code: '',
    state: '',
    email_address: '',
    phone_number: ''
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await gopag.tokenize(cardData, {
        billing: billingData
      });
      
      if (result.success) {
        // Send token and 3DS data to your backend
        await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cardToken: result.card.token,
            three_d_secure: result.three_d_secure
          })
        });
        
        alert('Payment processed successfully!');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Cardholder name"
        value={cardData.holder_name}
        onChange={(e) => setCardData({ ...cardData, holder_name: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Card number"
        value={cardData.card_number}
        onChange={(e) => setCardData({ ...cardData, card_number: e.target.value })}
        required
      />
      {/* Add other card fields */}
      
      <h3>Billing Information</h3>
      <input
        type="text"
        placeholder="Address"
        value={billingData.address}
        onChange={(e) => setBillingData({ ...billingData, address: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="City"
        value={billingData.city}
        onChange={(e) => setBillingData({ ...billingData, city: e.target.value })}
        required
      />
      {/* Add other billing fields */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}

export default CheckoutForm;
```

### Vue 3

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="cardData.holder_name" placeholder="Cardholder name" required />
    <input v-model="cardData.card_number" placeholder="Card number" required />
    <input v-model="cardData.expiration_month" placeholder="Month" required />
    <input v-model="cardData.expiration_year" placeholder="Year" required />
    <input v-model="cardData.security_code" placeholder="CVV" required />
    
    <h3>Billing Information</h3>
    <input v-model="billingData.address" placeholder="Address" required />
    <input v-model="billingData.city" placeholder="City" required />
    <input v-model="billingData.postal_code" placeholder="Postal code" required />
    <input v-model="billingData.state" placeholder="State" required />
    <input v-model="billingData.email_address" placeholder="Email" required />
    <input v-model="billingData.phone_number" placeholder="Phone" required />
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Processing...' : 'Pay' }}
    </button>
  </form>
</template>

<script>
import { ref } from 'vue';
import GoPagSDK from 'js-gopag-sdk';

export default {
  setup() {
    const gopag = new GoPagSDK({
      publishableKey: import.meta.env.VITE_ZOOP_KEY,
      marketplaceId: import.meta.env.VITE_MARKETPLACE_ID,
      environment: 'production',
      enable3DS: true
    });

    const cardData = ref({
      holder_name: '',
      card_number: '',
      expiration_month: '',
      expiration_year: '',
      security_code: ''
    });

    const billingData = ref({
      address: '',
      city: '',
      postal_code: '',
      state: '',
      email_address: '',
      phone_number: ''
    });

    const loading = ref(false);

    const handleSubmit = async () => {
      loading.value = true;

      try {
        const result = await gopag.tokenize(cardData.value, {
          billing: billingData.value
        });
        
        if (result.success) {
          console.log('Token:', result.card.token);
          console.log('3DS Data:', result.three_d_secure);
        } else {
          alert('Error: ' + result.error);
        }
      } finally {
        loading.value = false;
      }
    };

    return { cardData, billingData, loading, handleSubmit };
  }
};
</script>
```

### Angular

```typescript
import { Component } from '@angular/core';
import GoPagSDK from 'js-gopag-sdk';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent {
  private gopag: any;
  
  cardData = {
    holder_name: '',
    card_number: '',
    expiration_month: '',
    expiration_year: '',
    security_code: ''
  };

  billingData = {
    address: '',
    city: '',
    postal_code: '',
    state: '',
    email_address: '',
    phone_number: ''
  };

  loading = false;

  constructor() {
    this.gopag = new GoPagSDK({
      publishableKey: 'your_publishable_key',
      marketplaceId: 'your_marketplace_id',
      environment: 'production',
      enable3DS: true
    });
  }

  async onSubmit() {
    this.loading = true;

    try {
      const result = await this.gopag.tokenize(this.cardData, {
        billing: this.billingData
      });
      
      if (result.success) {
        // Process payment with token and 3DS data
        console.log('Card token:', result.card.token);
        console.log('3DS data:', result.three_d_secure);
      } else {
        alert('Error: ' + result.error);
      }
    } finally {
      this.loading = false;
    }
  }
}
```

## 🛠 Utilities

### Card number formatting

```javascript
const formatted = GoPagSDK.formatCardNumber('4111111111111111');
// Result: "4111 1111 1111 1111"
```

### Card brand detection

```javascript
const brand = GoPagSDK.detectCardBrand('4111111111111111');
// Result: "visa"

// Supports all Brazilian brands:
// - visa, mastercard, amex, elo, hipercard
// - aura, cabal, banescard
// - diners, discover, jcb
```

**Supported Brazilian Card Brands:**

| Brand | Debit | Credit | BIN Examples |
|-------|-------|--------|--------------|
| Visa | ✅ | ✅ | 4xxxxx |
| Mastercard | ✅ | ✅ | 51-55xxxx |
| Elo | ✅ | ✅ | 40117x, 50417x, 62778x, 65000x |
| Hipercard | ✅ | ✅ | 60628x, 63709x |
| Aura | ✅ | ✅ | 50xxxx |
| Cabal | ✅ | ✅ | 6042xx, 6043xx |
| Banescard | ✅ | ✅ | 603182, 603193 |
| American Express | ❌ | ✅ | 34xxxx, 37xxxx |
| Diners Club | ❌ | ✅ | 30x-305, 36x, 38x |

## 📋 API Response

### Success

```javascript
{
  success: true,
  processingTime: 1234, // ms
  card: {
    token: "card_token_xxxxx",
    id: "card_id_xxxxx",
    first4: "4111",
    last4: "1111",
    brand: "visa",
    expiration_month: 12,
    expiration_year: 2025,
    holder_name: "João da Silva",
    is_valid: true,
    is_verified: false,
    fingerprint: "fingerprint_xxxxx"
  },
  recaptcha: { // if enabled
    token: "recaptcha_token",
    action: "checkout"
  },
  three_d_secure: { // if enabled
    device: {
      device: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      colorDepth: 24,
      type: "BROWSER",
      javaEnabled: false,
      language: "pt-BR",
      screenHeight: 1080,
      screenWidth: 1920,
      timezoneOffset: 3
    },
    billing: { // if billing data provided
      address: "Rua Example, 123",
      city: "Goiânia",
      postal_code: "74000-000",
      state: "go",
      country: "br",
      email_address: "user@example.com",
      phone_number: 62991838359
    }
  }
}
```

### Error

```javascript
{
  success: false,
  error: "Error message in English",
  details: { ... }
}
```

## 🔒 Security

- ⚠️ **NEVER** send card data to your server
- ✅ Always use HTTPS in production
- ✅ SDK tokenizes data directly with Zoop (PCI/DSS certified server)
- ✅ Only the token is sent to your backend
- ✅ PCI DSS compliance maintained
- ✅ 3DS device fingerprinting and billing data for fraud prevention

## 🌐 Zoop API Integration

The SDK uses Zoop's tokenization endpoint:

```
POST https://api.zoop.ws/v1/marketplaces/{marketplace_id}/cards/tokens
```

**Required Configuration:**
- `publishableKey`: Your Zoop publishable key (starts with `zpk_`)
- `marketplaceId`: Your Zoop marketplace ID

**Optional 3DS Configuration:**
- `enable3DS`: Set to `true` to collect device and billing data
- Device data is automatically collected from the browser
- Billing data must be provided in the `options.billing` parameter

**Response Fields Mapped:**
- Token ID, card details, verification status
- Card fingerprint for fraud detection
- Complete card metadata
- 3D Secure device and billing information

## 📞 Support

Contact: suporte@gopag.com.br
