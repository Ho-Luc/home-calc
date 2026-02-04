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

export interface RefinanceInputs {
  // Current mortgage
  currentLoanAmount: number;
  currentInterestRate: number;
  currentRemainingYears: number;
  currentMonthsRemaining: number;
  
  // New mortgage
  newLoanAmount: number;
  newInterestRate: number;
  newLoanTermYears: number;
  
  // Refinance costs
  closingCosts: number;
  cashOut: number;
  
  // Additional payments
  extraMonthlyPayment: number;
  annualExtraPayment: number;
  enableAnnualPayment: boolean;
}

export interface RefinanceResults {
  currentMortgage: MortgageResults;
  newMortgage: MortgageResults;
  newMortgageWithExtras: AdditionalPaymentResults;
  monthlySavings: number;
  totalInterestSavings: number;
  totalSavings: number;
  breakEvenMonths: number;
  payoffTimeSaved: number; // in months
}

export interface AdditionalPaymentResults extends MortgageResults {
  payoffDate: string;
  timeSavedMonths: number;
  interestSaved: number;
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
 * Calculate mortgage with additional payments
 */
export function calculateMortgageWithExtras(
  inputs: MortgageInputs,
  extraMonthlyPayment: number = 0,
  annualExtraPayment: number = 0,
  enableAnnualPayment: boolean = false
): AdditionalPaymentResults {
  const { loanAmount, interestRate, loanTermYears } = inputs;
  const monthlyInterestRate = interestRate / 100 / 12;
  const regularPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
  const totalMonthlyPayment = regularPayment + extraMonthlyPayment;
  
  const schedule: PaymentScheduleItem[] = [];
  let remainingBalance = loanAmount;
  let cumulativeInterest = 0;
  let paymentNumber = 1;
  const startDate = new Date();
  
  while (remainingBalance > 0.01 && paymentNumber <= (loanTermYears * 12)) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    let principalPayment = totalMonthlyPayment - interestPayment;
    
    // Apply annual extra payment if enabled (in January)
    let extraPayment = 0;
    if (enableAnnualPayment && annualExtraPayment > 0 && paymentNumber % 12 === 1 && paymentNumber > 1) {
      extraPayment = Math.min(annualExtraPayment, remainingBalance);
      principalPayment += extraPayment;
    }
    
    // Don't overpay
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
    }
    
    remainingBalance -= principalPayment;
    cumulativeInterest += interestPayment;
    
    if (remainingBalance < 0.01) {
      remainingBalance = 0;
    }
    
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + paymentNumber);
    
    schedule.push({
      paymentNumber,
      paymentDate: paymentDate.toISOString().split('T')[0],
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      totalPayment: Math.round((interestPayment + principalPayment) * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100
    });
    
    paymentNumber++;
    
    if (remainingBalance <= 0.01) break;
  }
  
  const originalTerm = loanTermYears * 12;
  const actualTerm = schedule.length;
  const timeSavedMonths = originalTerm - actualTerm;
  
  const regularMortgage = calculateMortgageDetails(inputs);
  const interestSaved = regularMortgage.totalInterest - cumulativeInterest;
  
  const lastPayment = schedule[schedule.length - 1];
  const payoffDate = lastPayment ? lastPayment.paymentDate : '';
  
  // Calculate total payments including extras
  const totalOfAllPayments = schedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
  
  return {
    monthlyPayment: totalMonthlyPayment,
    monthlyPrincipalAndInterest: regularPayment,
    totalInterest: cumulativeInterest,
    totalPayments: totalOfAllPayments,
    paymentSchedule: schedule,
    payoffDate,
    timeSavedMonths,
    interestSaved
  };
}

/**
 * Calculate refinance comparison
 */
export function calculateRefinanceComparison(inputs: RefinanceInputs): RefinanceResults {
  // Current mortgage calculations
  const currentInputs: MortgageInputs = {
    loanAmount: inputs.currentLoanAmount,
    interestRate: inputs.currentInterestRate,
    loanTermYears: inputs.currentRemainingYears
  };
  const currentMortgage = calculateMortgageDetails(currentInputs);
  
  // New mortgage calculations
  const newInputs: MortgageInputs = {
    loanAmount: inputs.newLoanAmount,
    interestRate: inputs.newInterestRate,
    loanTermYears: inputs.newLoanTermYears
  };
  const newMortgage = calculateMortgageDetails(newInputs);
  
  // New mortgage with additional payments
  const newMortgageWithExtras = calculateMortgageWithExtras(
    newInputs,
    inputs.extraMonthlyPayment,
    inputs.annualExtraPayment,
    inputs.enableAnnualPayment
  );
  
  // Calculate savings
  const monthlySavings = currentMortgage.monthlyPayment - newMortgage.monthlyPayment;
  const totalInterestSavings = currentMortgage.totalInterest - newMortgageWithExtras.totalInterest;
  const totalSavings = totalInterestSavings - inputs.closingCosts + inputs.cashOut;
  
  // Calculate break-even point
  const breakEvenMonths = inputs.closingCosts / Math.max(monthlySavings, 1);
  
  // Calculate payoff time saved
  const currentTotalMonths = inputs.currentRemainingYears * 12;
  const newTotalMonths = newMortgageWithExtras.paymentSchedule.length;
  const payoffTimeSaved = currentTotalMonths - newTotalMonths;
  
  return {
    currentMortgage,
    newMortgage,
    newMortgageWithExtras,
    monthlySavings,
    totalInterestSavings,
    totalSavings,
    breakEvenMonths,
    payoffTimeSaved
  };
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
 * Format time periods (months to years and months)
 */
export function formatTimePeriod(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round(months % 12);
  
  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
}

/**
 * Validate refinance input values
 */
export function validateRefinanceInputs(inputs: RefinanceInputs): string[] {
  const errors: string[] = [];
  
  // Current mortgage validation
  if (inputs.currentLoanAmount <= 0) {
    errors.push('Current loan amount must be greater than 0');
  }
  if (inputs.currentInterestRate < 0) {
    errors.push('Current interest rate cannot be negative');
  }
  if (inputs.currentRemainingYears <= 0) {
    errors.push('Current remaining years must be greater than 0');
  }
  
  // New mortgage validation
  if (inputs.newLoanAmount <= 0) {
    errors.push('New loan amount must be greater than 0');
  }
  if (inputs.newInterestRate < 0) {
    errors.push('New interest rate cannot be negative');
  }
  if (inputs.newLoanTermYears <= 0) {
    errors.push('New loan term must be greater than 0');
  }
  
  // Additional payments validation
  if (inputs.extraMonthlyPayment < 0) {
    errors.push('Extra monthly payment cannot be negative');
  }
  if (inputs.annualExtraPayment < 0) {
    errors.push('Annual extra payment cannot be negative');
  }
  if (inputs.closingCosts < 0) {
    errors.push('Closing costs cannot be negative');
  }
  
  return errors;
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

// ===== REFINANCE CALCULATION INTERFACES AND FUNCTIONS =====

export interface RefinanceInputs {
  // Current mortgage
  currentLoanAmount: number;
  currentInterestRate: number;
  currentRemainingYears: number;
  currentMonthsRemaining: number;
  
  // New mortgage
  newLoanAmount: number;
  newInterestRate: number;
  newLoanTermYears: number;
  
  // Refinance costs
  closingCosts: number;
  cashOut: number;
  
  // Additional payments
  extraMonthlyPayment: number;
  annualExtraPayment: number;
  enableAnnualPayment: boolean;
}

export interface RefinanceResults {
  currentMortgage: MortgageResults;
  newMortgage: MortgageResults;
  newMortgageWithExtras: MortgageResults;
  monthlySavings: number;
  totalInterestSavings: number;
  totalSavings: number;
  breakEvenMonths: number;
  payoffTimeSaved: number; // months
}

export interface MortgageWithExtrasResults {
  monthlyPayment: number;
  totalInterest: number;
  totalPayments: number;
  paymentSchedule: PaymentScheduleItem[];
  timeSavedMonths: number;
  interestSaved: number;
  payoffDate: string;
}

/**
 * Generate payment schedule with extra payments
 */
function generateScheduleWithExtras(
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number,
  extraMonthlyPayment: number,
  annualExtraPayment: number,
  enableAnnualPayment: boolean
): PaymentScheduleItem[] {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  const baseMonthlyPayment = calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears);
  
  const schedule: PaymentScheduleItem[] = [];
  let remainingBalance = loanAmount;
  let cumulativeInterest = 0;
  let paymentNumber = 1;
  
  const startDate = new Date();

  while (remainingBalance > 0.01 && paymentNumber <= numberOfPayments * 2) { // Allow up to double the term
    const interestPayment = remainingBalance * monthlyInterestRate;
    let principalPayment = baseMonthlyPayment - interestPayment;
    let totalPayment = baseMonthlyPayment;
    
    // Add monthly extra payment
    if (extraMonthlyPayment > 0) {
      principalPayment += extraMonthlyPayment;
      totalPayment += extraMonthlyPayment;
    }
    
    // Add annual extra payment (assuming January each year)
    if (enableAnnualPayment && annualExtraPayment > 0 && paymentNumber % 12 === 1 && paymentNumber > 1) {
      principalPayment += annualExtraPayment;
      totalPayment += annualExtraPayment;
    }
    
    // Ensure we don't overpay
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
      totalPayment = interestPayment + principalPayment;
    }
    
    remainingBalance -= principalPayment;
    cumulativeInterest += interestPayment;
    
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + paymentNumber);
    
    schedule.push({
      paymentNumber,
      paymentDate: paymentDate.toISOString().split('T')[0],
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100
    });
    
    paymentNumber++;
  }
  
  return schedule;
}

/**
 * Calculate mortgage with extra payments
 */
export function calculateMortgageWithExtras(
  baseInputs: MortgageInputs,
  extraMonthlyPayment: number,
  annualExtraPayment: number,
  enableAnnualPayment: boolean
): MortgageWithExtrasResults {
  // Calculate base mortgage for comparison
  const baseMortgage = calculateMortgageDetails(baseInputs);
  
  // Calculate with extra payments
  const scheduleWithExtras = generateScheduleWithExtras(
    baseInputs.loanAmount,
    baseInputs.interestRate,
    baseInputs.loanTermYears,
    extraMonthlyPayment,
    annualExtraPayment,
    enableAnnualPayment
  );
  
  const totalInterest = scheduleWithExtras.reduce((sum, payment) => sum + payment.interestPayment, 0);
  const totalPayments = scheduleWithExtras.reduce((sum, payment) => sum + payment.totalPayment, 0);
  const baseMonthlyPayment = calculateMonthlyPayment(baseInputs.loanAmount, baseInputs.interestRate, baseInputs.loanTermYears);
  const monthlyPayment = baseMonthlyPayment + extraMonthlyPayment;
  
  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + scheduleWithExtras.length);
  
  // Calculate savings
  const timeSavedMonths = baseMortgage.paymentSchedule.length - scheduleWithExtras.length;
  const interestSaved = baseMortgage.totalInterest - totalInterest;
  
  return {
    monthlyPayment,
    totalInterest,
    totalPayments,
    paymentSchedule: scheduleWithExtras,
    timeSavedMonths,
    interestSaved,
    payoffDate: payoffDate.toISOString().split('T')[0]
  };
}

/**
 * Calculate refinance comparison
 */
export function calculateRefinanceComparison(inputs: RefinanceInputs): RefinanceResults {
  // Current mortgage calculation
  const currentMortgageInputs: MortgageInputs = {
    loanAmount: inputs.currentLoanAmount,
    interestRate: inputs.currentInterestRate,
    loanTermYears: inputs.currentRemainingYears
  };
  const currentMortgage = calculateMortgageDetails(currentMortgageInputs);
  
  // New mortgage calculation
  const newMortgageInputs: MortgageInputs = {
    loanAmount: inputs.newLoanAmount + inputs.cashOut, // Add cash out to loan amount
    interestRate: inputs.newInterestRate,
    loanTermYears: inputs.newLoanTermYears
  };
  const newMortgage = calculateMortgageDetails(newMortgageInputs);
  
  // New mortgage with extra payments
  const newMortgageWithExtras = calculateMortgageWithExtras(
    newMortgageInputs,
    inputs.extraMonthlyPayment,
    inputs.annualExtraPayment,
    inputs.enableAnnualPayment
  );
  
  // Convert to expected format
  const newMortgageWithExtrasFormatted: MortgageResults = {
    monthlyPayment: newMortgageWithExtras.monthlyPayment,
    monthlyPrincipalAndInterest: newMortgageWithExtras.monthlyPayment,
    totalInterest: newMortgageWithExtras.totalInterest,
    totalPayments: newMortgageWithExtras.totalPayments,
    paymentSchedule: newMortgageWithExtras.paymentSchedule
  };
  
  // Calculate comparison metrics
  const monthlySavings = currentMortgage.monthlyPayment - newMortgageWithExtras.monthlyPayment;
  const totalInterestSavings = currentMortgage.totalInterest - newMortgageWithExtras.totalInterest;
  const totalSavings = totalInterestSavings - inputs.closingCosts;
  
  // Calculate break-even point (months to recover closing costs)
  let breakEvenMonths = 0;
  if (monthlySavings > 0) {
    breakEvenMonths = Math.ceil(inputs.closingCosts / monthlySavings);
  } else {
    breakEvenMonths = 999; // Very high number if no monthly savings
  }
  
  const payoffTimeSaved = currentMortgage.paymentSchedule.length - newMortgageWithExtras.paymentSchedule.length;
  
  return {
    currentMortgage,
    newMortgage,
    newMortgageWithExtras: newMortgageWithExtrasFormatted,
    monthlySavings,
    totalInterestSavings,
    totalSavings,
    breakEvenMonths,
    payoffTimeSaved
  };
}

/**
 * Validate refinance inputs
 */
export function validateRefinanceInputs(inputs: RefinanceInputs): string[] {
  const errors: string[] = [];
  
  // Current mortgage validation
  if (inputs.currentLoanAmount <= 0) {
    errors.push('Current loan amount must be greater than 0');
  }
  
  if (inputs.currentInterestRate < 0 || inputs.currentInterestRate > 50) {
    errors.push('Current interest rate must be between 0% and 50%');
  }
  
  if (inputs.currentRemainingYears <= 0 || inputs.currentRemainingYears > 50) {
    errors.push('Current remaining years must be between 1 and 50');
  }
  
  // New mortgage validation
  if (inputs.newLoanAmount <= 0) {
    errors.push('New loan amount must be greater than 0');
  }
  
  if (inputs.newInterestRate < 0 || inputs.newInterestRate > 50) {
    errors.push('New interest rate must be between 0% and 50%');
  }
  
  if (inputs.newLoanTermYears <= 0 || inputs.newLoanTermYears > 50) {
    errors.push('New loan term must be between 1 and 50 years');
  }
  
  // Cost validation
  if (inputs.closingCosts < 0) {
    errors.push('Closing costs cannot be negative');
  }
  
  // Extra payment validation
  if (inputs.extraMonthlyPayment < 0) {
    errors.push('Extra monthly payment cannot be negative');
  }
  
  if (inputs.annualExtraPayment < 0) {
    errors.push('Annual extra payment cannot be negative');
  }
  
  return errors;
}

/**
 * Format time period in months to readable string
 */
export function formatTimePeriod(months: number): string {
  if (months <= 0) return '0 months';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  } else if (remainingMonths === 0) {
    return `${years} year${years === 1 ? '' : 's'}`;
  } else {
    return `${years} year${years === 1 ? '' : 's'}, ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  }
}
