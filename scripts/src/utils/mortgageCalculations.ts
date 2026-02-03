export interface MortgageInputs {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  propertyTax?: number;
  homeInsurance?: number;
  pmi?: number;
  hoaFees?: number;
}

export interface MortgageResults {
  monthlyPayment: number;
  monthlyPrincipalAndInterest: number;
  totalInterest: number;
  totalPayments: number;
  paymentSchedule: PaymentScheduleItem[];
}

export interface PaymentScheduleItem {
  paymentNumber: number;
  paymentDate: string;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

export interface ChartDataPoint {
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Calculate monthly mortgage payment using the standard formula
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  if (annualInterestRate === 0) {
    return loanAmount / (loanTermYears * 12);
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  return monthlyPayment;
}

/**
 * Calculate complete mortgage details including payment schedule
 */
export function calculateMortgageDetails(inputs: MortgageInputs): MortgageResults {
  const { loanAmount, interestRate, loanTermYears, propertyTax = 0, homeInsurance = 0, pmi = 0, hoaFees = 0 } = inputs;
  
  const monthlyPrincipalAndInterest = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
  const monthlyPropertyTax = propertyTax / 12;
  const monthlyInsurance = homeInsurance / 12;
  const monthlyPMI = pmi / 12;
  const monthlyHOA = hoaFees / 12;
  
  const monthlyPayment = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyInsurance + monthlyPMI + monthlyHOA;
  
  const paymentSchedule = generatePaymentSchedule(loanAmount, interestRate, loanTermYears);
  const totalInterest = paymentSchedule.reduce((sum, payment) => sum + payment.interestPayment, 0);
  const totalPayments = monthlyPayment * loanTermYears * 12;

  return {
    monthlyPayment,
    monthlyPrincipalAndInterest,
    totalInterest,
    totalPayments,
    paymentSchedule
  };
}

/**
 * Generate complete payment schedule for the mortgage
 */
export function generatePaymentSchedule(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): PaymentScheduleItem[] {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears);
  
  const schedule: PaymentScheduleItem[] = [];
  let remainingBalance = loanAmount;
  let cumulativeInterest = 0;
  
  const startDate = new Date();

  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;
    cumulativeInterest += interestPayment;
    
    // Ensure remaining balance doesn't go negative due to floating point precision
    if (remainingBalance < 0.01) {
      remainingBalance = 0;
    }
    
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + i);
    
    schedule.push({
      paymentNumber: i,
      paymentDate: paymentDate.toISOString().split('T')[0], // YYYY-MM-DD format
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      totalPayment: Math.round(monthlyPayment * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100
    });
  }
  
  return schedule;
}

/**
 * Generate data for the principal vs interest chart
 */
export function generateChartData(paymentSchedule: PaymentScheduleItem[]): ChartDataPoint[] {
  return paymentSchedule.map((payment, index) => ({
    month: index + 1,
    principal: payment.principalPayment,
    interest: payment.interestPayment,
    balance: payment.remainingBalance
  }));
}

/**
 * Format currency values for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage values for display
 */
export function formatPercentage(rate: number): string {
  return `${rate.toFixed(3)}%`;
}

/**
 * Validate mortgage input values
 */
export function validateMortgageInputs(inputs: MortgageInputs): string[] {
  const errors: string[] = [];
  
  if (inputs.loanAmount <= 0) {
    errors.push('Loan amount must be greater than 0');
  }
  
  if (inputs.loanAmount > 10000000) {
    errors.push('Loan amount must be less than $10,000,000');
  }
  
  if (inputs.interestRate < 0) {
    errors.push('Interest rate cannot be negative');
  }
  
  if (inputs.interestRate > 50) {
    errors.push('Interest rate seems unreasonably high (>50%)');
  }
  
  if (inputs.loanTermYears <= 0) {
    errors.push('Loan term must be greater than 0 years');
  }
  
  if (inputs.loanTermYears > 50) {
    errors.push('Loan term must be 50 years or less');
  }
  
  return errors;
}