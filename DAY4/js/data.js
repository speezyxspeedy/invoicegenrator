/**
 * InvoiceCraft - Data Management & LocalStorage Handler
 */

const STORAGE_KEYS = {
  INVOICES: 'invoicecraft_invoices',
  CUSTOMERS: 'invoicecraft_customers',
  SETTINGS: 'invoicecraft_settings',
  THEME: 'invoicecraft_theme'
};

const DEFAULT_SETTINGS = {
  businessName: 'Apex Digital Solutions Pvt Ltd',
  businessEmail: 'billing@apexdigital.io',
  businessPhone: '+91 98765 43210',
  businessAddress: 'Suite 402, Cyber Heights, Sector 62\nBengaluru, Karnataka 560103, India',
  businessGstin: '29ABCDE1234F1Z5',
  businessLogo: '',
  defaultCurrency: 'INR',
  defaultTaxRate: 18,
  defaultPaymentTerms: '15', // days
  bankDetails: 'Bank: HDFC Bank Ltd\nA/C Name: Apex Digital Solutions Pvt Ltd\nA/C No: 50200012345678\nIFSC: HDFC0001234\nUPI: apexdigital@hdfcbank',
  defaultNotes: 'Thank you for your business! Please make payment within the due date.',
  defaultTerms: '1. Invoices not paid within terms are subject to late fee.\n2. Goods/services once delivered are non-refundable.\n3. Make all payments to the specified bank/UPI account.'
};

const SAMPLE_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'TechCorp Innovations',
    email: 'accounts@techcorp.com',
    phone: '+91 98234 56789',
    address: 'Plot 45, HITEC City, Phase 2\nHyderabad, Telangana 500081',
    gstin: '36AAACT1234M1Z2',
    createdAt: '2026-08-10'
  },
  {
    id: 'cust-2',
    name: 'Nimbus Cloud Labs Inc',
    email: 'billing@nimbuscloud.io',
    phone: '+1 (555) 349-2041',
    address: '742 Evergreen Terrace, Suite 10\nSan Francisco, CA 94107, USA',
    gstin: 'TAX-US-941078',
    createdAt: '2026-08-22'
  },
  {
    id: 'cust-3',
    name: 'Acme Retail Ventures',
    email: 'finance@acmeretail.in',
    phone: '+91 91234 98765',
    address: '12 Commercial Street, Connaught Place\nNew Delhi, Delhi 110001',
    gstin: '07AAACA9876K1Z9',
    createdAt: '2026-09-05'
  },
  {
    id: 'cust-4',
    name: 'Horizon Studio Berlin',
    email: 'invoicing@horizonstudio.de',
    phone: '+49 30 1234567',
    address: 'Friedrichstraße 176-179\n10117 Berlin, Germany',
    gstin: 'DE814523981',
    createdAt: '2026-09-18'
  }
];

const SAMPLE_INVOICES = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-001',
    status: 'paid',
    date: '2026-09-15',
    dueDate: '2026-09-30',
    currency: 'INR',
    customer: {
      id: 'cust-1',
      name: 'TechCorp Innovations',
      email: 'accounts@techcorp.com',
      phone: '+91 98234 56789',
      address: 'Plot 45, HITEC City, Phase 2\nHyderabad, Telangana 500081',
      gstin: '36AAACT1234M1Z2'
    },
    business: {
      name: 'Apex Digital Solutions Pvt Ltd',
      email: 'billing@apexdigital.io',
      phone: '+91 98765 43210',
      address: 'Suite 402, Cyber Heights, Sector 62\nBengaluru, Karnataka 560103, India',
      gstin: '29ABCDE1234F1Z5'
    },
    items: [
      { id: 'item-1', description: 'Enterprise UI/UX Design System & Prototypes', quantity: 1, unitPrice: 85000, amount: 85000 },
      { id: 'item-2', description: 'React Dashboard Frontend Development (Sprint 1-3)', quantity: 120, unitPrice: 1200, amount: 144000 },
      { id: 'item-3', description: 'Cloud Infrastructure & CI/CD Setup', quantity: 1, unitPrice: 35000, amount: 35000 }
    ],
    subtotal: 264000,
    discountType: 'percentage',
    discountValue: 5,
    discountAmount: 13200,
    taxRate: 18,
    taxAmount: 45144,
    shippingAmount: 0,
    total: 295944,
    notes: 'Payment received with thanks via NEFT on 28-Sep-2026.',
    terms: 'Standard net 15 payment terms.',
    paymentDetails: 'Bank: HDFC Bank Ltd | A/C: 50200012345678 | IFSC: HDFC0001234',
    paidAt: '2026-09-28'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-002',
    status: 'sent',
    date: '2026-10-02',
    dueDate: '2026-10-25',
    currency: 'INR',
    customer: {
      id: 'cust-3',
      name: 'Acme Retail Ventures',
      email: 'finance@acmeretail.in',
      phone: '+91 91234 98765',
      address: '12 Commercial Street, Connaught Place\nNew Delhi, Delhi 110001',
      gstin: '07AAACA9876K1Z9'
    },
    business: {
      name: 'Apex Digital Solutions Pvt Ltd',
      email: 'billing@apexdigital.io',
      phone: '+91 98765 43210',
      address: 'Suite 402, Cyber Heights, Sector 62\nBengaluru, Karnataka 560103, India',
      gstin: '29ABCDE1234F1Z5'
    },
    items: [
      { id: 'item-1', description: 'E-commerce POS Gateway Integration', quantity: 1, unitPrice: 75000, amount: 75000 },
      { id: 'item-2', description: 'Inventory Automation Microservice API', quantity: 1, unitPrice: 60000, amount: 60000 },
      { id: 'item-3', description: 'Annual Priority SLA Support (Q4 2026)', quantity: 1, unitPrice: 24000, amount: 24000 }
    ],
    subtotal: 159000,
    discountType: 'fixed',
    discountValue: 9000,
    discountAmount: 9000,
    taxRate: 18,
    taxAmount: 27000,
    shippingAmount: 0,
    total: 177000,
    notes: 'Please quote invoice number INV-2026-002 in payment remarks.',
    terms: 'Payment due on or before due date.',
    paymentDetails: 'Bank: HDFC Bank Ltd | A/C: 50200012345678 | IFSC: HDFC0001234',
    paidAt: null
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2026-003',
    status: 'overdue',
    date: '2026-09-01',
    dueDate: '2026-09-20',
    currency: 'INR',
    customer: {
      id: 'cust-1',
      name: 'TechCorp Innovations',
      email: 'accounts@techcorp.com',
      phone: '+91 98234 56789',
      address: 'Plot 45, HITEC City, Phase 2\nHyderabad, Telangana 500081',
      gstin: '36AAACT1234M1Z2'
    },
    business: {
      name: 'Apex Digital Solutions Pvt Ltd',
      email: 'billing@apexdigital.io',
      phone: '+91 98765 43210',
      address: 'Suite 402, Cyber Heights, Sector 62\nBengaluru, Karnataka 560103, India',
      gstin: '29ABCDE1234F1Z5'
    },
    items: [
      { id: 'item-1', description: 'Performance Audit & Security Vulnerability Assessment', quantity: 1, unitPrice: 48000, amount: 48000 },
      { id: 'item-2', description: 'Database Query Optimization & Indexing', quantity: 18, unitPrice: 1500, amount: 27000 }
    ],
    subtotal: 75000,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 18,
    taxAmount: 13500,
    shippingAmount: 0,
    total: 88500,
    notes: 'Overdue notice: Payment is past due by over 20 days.',
    terms: 'Overdue invoices incur 1.5% interest per month.',
    paymentDetails: 'Bank: HDFC Bank Ltd | A/C: 50200012345678 | IFSC: HDFC0001234',
    paidAt: null
  },
  {
    id: 'inv-1004',
    invoiceNumber: 'INV-2026-004',
    status: 'draft',
    date: '2026-10-14',
    dueDate: '2026-10-29',
    currency: 'USD',
    customer: {
      id: 'cust-2',
      name: 'Nimbus Cloud Labs Inc',
      email: 'billing@nimbuscloud.io',
      phone: '+1 (555) 349-2041',
      address: '742 Evergreen Terrace, Suite 10\nSan Francisco, CA 94107, USA',
      gstin: 'TAX-US-941078'
    },
    business: {
      name: 'Apex Digital Solutions Pvt Ltd',
      email: 'billing@apexdigital.io',
      phone: '+91 98765 43210',
      address: 'Suite 402, Cyber Heights, Sector 62\nBengaluru, Karnataka 560103, India',
      gstin: '29ABCDE1234F1Z5'
    },
    items: [
      { id: 'item-1', description: 'Kubernetes Cluster Migration & Helm Charts', quantity: 40, unitPrice: 95, amount: 3800 },
      { id: 'item-2', description: 'Multi-region High Availability Setup', quantity: 1, unitPrice: 1450, amount: 1450 }
    ],
    subtotal: 5250,
    discountType: 'percentage',
    discountValue: 10,
    discountAmount: 525,
    taxRate: 0,
    taxAmount: 0,
    shippingAmount: 0,
    total: 4725,
    notes: 'Draft proposal for Q4 migration phase.',
    terms: 'Wire transfer details will be provided upon confirmation.',
    paymentDetails: 'SWIFT / Wire transfer to HDFC Bank India',
    paidAt: null
  },
  {
    id: 'inv-1005',
    invoiceNumber: 'INV-2026-005',
    status: 'paid',
    date: '2026-08-18',
    dueDate: '2026-09-02',
    currency: 'EUR',
    customer: {
      id: 'cust-4',
      name: 'Horizon Studio Berlin',
      email: 'invoicing@horizonstudio.de',
      phone: '+49 30 1234567',
      address: 'Friedrichstraße 176-179\n10117 Berlin, Germany',
      gstin: 'DE814523981'
    },
    business: {
      name: 'Apex Digital Solutions Pvt Ltd',
      email: 'billing@apexdigital.io',
      phone: '+91 98765 43210',
      address: 'Suite 402, Cyber Heights, Sector 62\nBengaluru, Karnataka 560103, India',
      gstin: '29ABCDE1234F1Z5'
    },
    items: [
      { id: 'item-1', description: 'Custom Brand Motion Graphics & WebGL Hero', quantity: 1, unitPrice: 3200, amount: 3200 },
      { id: 'item-2', description: 'Design Token Synchronizer CLI Tool', quantity: 1, unitPrice: 1100, amount: 1100 }
    ],
    subtotal: 4300,
    discountType: 'percentage',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 19,
    taxAmount: 817,
    shippingAmount: 0,
    total: 5117,
    notes: 'Paid via SEPA Transfer on 30-Aug-2026.',
    terms: 'Net 15 days.',
    paymentDetails: 'IBAN: DE89370400440532013000 | BIC: COBADEFFXXX',
    paidAt: '2026-08-30'
  }
];

class StorageManager {
  static getInvoices() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (!data) {
        this.saveInvoices(SAMPLE_INVOICES);
        return [...SAMPLE_INVOICES];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading invoices from localStorage:', e);
      return [...SAMPLE_INVOICES];
    }
  }

  static saveInvoices(invoices) {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }

  static getCustomers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!data) {
        this.saveCustomers(SAMPLE_CUSTOMERS);
        return [...SAMPLE_CUSTOMERS];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error loading customers from localStorage:', e);
      return [...SAMPLE_CUSTOMERS];
    }
  }

  static saveCustomers(customers) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  }

  static saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static resetToSampleData() {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(SAMPLE_INVOICES));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SAMPLE_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }

  static clearAllData() {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
  }

  static exportBackup() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      invoices: this.getInvoices(),
      customers: this.getCustomers(),
      settings: this.getSettings()
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.invoices)) {
        this.saveInvoices(data.invoices);
      }
      if (Array.isArray(data.customers)) {
        this.saveCustomers(data.customers);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(data.settings);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

window.StorageManager = StorageManager;
