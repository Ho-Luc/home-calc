# Mortgage Calculator

A professional, responsive mortgage calculator web application built with React, TypeScript, and Vite. Designed for easy testing with Playwright and local development.

## Features

### Home Page - Mortgage Calculator
- **Complete mortgage payment calculation** including principal, interest, taxes, insurance, PMI, and HOA fees
- **Total interest paid** over the life of the loan
- **Interactive charts** showing principal vs interest payments over time and loan balance progression
- **Detailed payment schedule table** with monthly breakdown of all payments
- **Real-time calculation** as you type with input validation
- **Responsive design** that works on desktop and mobile

### Refinance Page (Coming Soon)
- Refinance comparison calculator
- Additional payment scenarios
- Annual extra payment options

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite (fast development and building)
- **Charts**: Chart.js with React Chart.js 2
- **Routing**: React Router DOM
- **Testing**: Playwright (ready for E2E tests)
- **Styling**: Custom CSS with modern design system

## Getting Started

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run Playwright tests with UI
- `npm run test:headed` - Run Playwright tests in headed mode

## Testing

The application is designed for easy testing with Playwright. All interactive elements have `data-testid` attributes:

### Key Test IDs for Home Page:
- `home-page` - Main container
- `calculator-form` - Main form
- `loan-amount-input` - Loan amount input field
- `interest-rate-input` - Interest rate input field
- `loan-term-input` - Loan term input field
- `results-section` - Results display area
- `monthly-payment` - Monthly payment result
- `total-interest` - Total interest result
- `payment-chart` - Principal vs interest chart
- `balance-chart` - Loan balance chart
- `payment-schedule-button` - Button to open payment table
- `payment-schedule-modal` - Payment schedule modal
- `payment-schedule-table` - Payment schedule table

### Navigation Test IDs:
- `header` - Main header
- `navigation` - Navigation menu
- `home-link` - Link to home page
- `refinance-link` - Link to refinance page

## Project Structure

```
src/
├── components/
│   ├── HomePage.tsx           # Main calculator page
│   ├── PaymentScheduleModal.tsx # Payment schedule table modal
│   └── RefinancePage.tsx      # Refinance calculator (placeholder)
├── utils/
│   └── mortgageCalculations.ts # Mortgage calculation utilities
├── App.tsx                    # Main app with routing
├── main.tsx                   # React entry point
└── index.css                  # Global styles
```

## Key Features for Testing

1. **Comprehensive Input Validation**: All inputs are validated with clear error messages
2. **Real-time Updates**: Calculations update automatically as inputs change
3. **Loading States**: Loading indicators for better UX during calculations
4. **Error Handling**: Proper error states and messages
5. **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation
6. **Responsive Design**: Works across different screen sizes

## Mortgage Calculation Features

- **Standard mortgage formula** for accurate payment calculations
- **Complete amortization schedule** generation
- **Support for additional costs** (taxes, insurance, PMI, HOA)
- **Interactive visualizations** with Chart.js
- **Currency formatting** and proper number handling
- **Input validation** with reasonable limits and error messages

## Development Guidelines

The codebase follows these principles:
- **TypeScript first** with strict type checking
- **Component-based architecture** with clear separation of concerns
- **Utility functions** for business logic separate from UI
- **Consistent naming** for easy testing and maintenance
- **Professional styling** with CSS custom properties
- **Performance optimizations** with React.memo and useMemo where appropriate

## Next Steps

1. Implement the refinance calculator page
2. Add more chart types and visualization options
3. Add export functionality for payment schedules
4. Implement loan comparison features
5. Add unit tests alongside E2E tests

## Contributing

When adding new features:
1. Add appropriate `data-testid` attributes for testing
2. Follow the established TypeScript patterns
3. Update this README with new test IDs and features
4. Ensure responsive design compatibility