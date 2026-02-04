import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  calculateRefinanceComparison,
  calculateMortgageWithExtras,
  validateRefinanceInputs,
  formatCurrency,
  formatTimePeriod,
  generateChartData,
  type RefinanceInputs,
  type RefinanceResults,
  type MortgageInputs,
} from '../utils/mortgageCalculations';
import PaymentScheduleModal from './PaymentScheduleModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RefinancePage: React.FC = () => {
  const [inputs, setInputs] = useState<RefinanceInputs>({
    // Current mortgage
    currentLoanAmount: 350000,
    currentInterestRate: 7.5,
    currentRemainingYears: 25,
    currentMonthsRemaining: 300,
    
    // New mortgage
    newLoanAmount: 350000,
    newInterestRate: 6.0,
    newLoanTermYears: 30,
    
    // Refinance costs
    closingCosts: 5000,
    cashOut: 0,
    
    // Additional payments
    extraMonthlyPayment: 0,
    annualExtraPayment: 0,
    enableAnnualPayment: false,
  });

  const [results, setResults] = useState<RefinanceResults | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showCurrentSchedule, setShowCurrentSchedule] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'refinance' | 'paydown'>('refinance');

  const handleInputChange = (field: keyof RefinanceInputs) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'enableAnnualPayment' 
      ? event.target.checked 
      : parseFloat(event.target.value) || 0;
    
    setInputs(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateRefinance = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const validationErrors = validateRefinanceInputs(inputs);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setResults(null);
      } else {
        setErrors([]);
        const refinanceResults = calculateRefinanceComparison(inputs);
        setResults(refinanceResults);
      }
      
      setIsCalculating(false);
    }, 300);
  };

  // Auto-calculate when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputs.currentLoanAmount > 0 && inputs.newLoanAmount > 0) {
        calculateRefinance();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputs]);

  // Chart data for comparison
  const comparisonChartData = useMemo(() => {
    if (!results) return null;

    const currentData = generateChartData(results.currentMortgage.paymentSchedule);
    const newData = generateChartData(results.newMortgageWithExtras.paymentSchedule);
    
    // Sample data for performance (every 12th month)
    const maxLength = Math.max(currentData.length, newData.length);
    const sampleRate = maxLength > 120 ? 12 : 6;
    
    const sampledCurrent = currentData.filter((_, index) => index % sampleRate === 0 || index === currentData.length - 1);
    const sampledNew = newData.filter((_, index) => index % sampleRate === 0 || index === newData.length - 1);
    
    // Create aligned data for comparison
    const maxSamples = Math.max(sampledCurrent.length, sampledNew.length);
    const labels = Array.from({ length: maxSamples }, (_, i) => `Year ${Math.ceil((i + 1) * sampleRate / 12)}`);
    
    return {
      labels: labels.slice(0, Math.min(sampledCurrent.length, sampledNew.length)),
      datasets: [
        {
          label: 'Current Mortgage Balance',
          data: sampledCurrent.map(d => d.balance),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
        {
          label: 'New Mortgage Balance',
          data: sampledNew.map(d => d.balance),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }, [results]);

  // Paydown-only calculation (current mortgage with extra payments)
  const paydownResults = useMemo(() => {
    if (!inputs.currentLoanAmount || activeTab !== 'paydown') return null;
    
    const currentMortgageInputs: MortgageInputs = {
      loanAmount: inputs.currentLoanAmount,
      interestRate: inputs.currentInterestRate,
      loanTermYears: inputs.currentRemainingYears
    };
    
    return calculateMortgageWithExtras(
      currentMortgageInputs,
      inputs.extraMonthlyPayment,
      inputs.annualExtraPayment,
      inputs.enableAnnualPayment
    );
  }, [inputs, activeTab]);

  const isRefinanceWorthwhile = results && results.totalSavings > 0 && results.breakEvenMonths < 60;

  return (
    <div className="container" data-testid="refinance-page">
      {/* Tab Navigation */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #e2e8f0' }}>
          <button
            className={`button ${activeTab === 'refinance' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('refinance')}
            data-testid="refinance-tab"
            style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
          >
            Refinance Comparison
          </button>
          <button
            className={`button ${activeTab === 'paydown' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('paydown')}
            data-testid="paydown-tab"
            style={{ borderRadius: '0.5rem 0.5rem 0 0' }}
          >
            Early Paydown Only
          </button>
        </div>

        {errors.length > 0 && (
          <div className="error-message" data-testid="error-messages">
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'refinance' && (
          <>
            <h2 data-testid="refinance-title">Refinance & Accelerated Paydown Calculator</h2>
            
            <form data-testid="refinance-form">
              {/* Current Mortgage Section */}
              <h3 style={{ color: '#ef4444', marginTop: '2rem' }}>Current Mortgage</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currentLoanAmount">Current Loan Balance ($)</label>
                  <input
                    type="number"
                    id="currentLoanAmount"
                    data-testid="current-loan-amount-input"
                    value={inputs.currentLoanAmount}
                    onChange={handleInputChange('currentLoanAmount')}
                    min="1000"
                    step="1000"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="currentInterestRate">Current Interest Rate (%)</label>
                  <input
                    type="number"
                    id="currentInterestRate"
                    data-testid="current-interest-rate-input"
                    value={inputs.currentInterestRate}
                    onChange={handleInputChange('currentInterestRate')}
                    min="0"
                    step="0.001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="currentRemainingYears">Current Remaining Years</label>
                <input
                  type="number"
                  id="currentRemainingYears"
                  data-testid="current-remaining-years-input"
                  value={inputs.currentRemainingYears}
                  onChange={handleInputChange('currentRemainingYears')}
                  min="1"
                  max="50"
                  step="1"
                />
              </div>

              {/* New Mortgage Section */}
              <h3 style={{ color: '#22c55e', marginTop: '2rem' }}>New Mortgage</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newLoanAmount">New Loan Amount ($)</label>
                  <input
                    type="number"
                    id="newLoanAmount"
                    data-testid="new-loan-amount-input"
                    value={inputs.newLoanAmount}
                    onChange={handleInputChange('newLoanAmount')}
                    min="1000"
                    step="1000"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newInterestRate">New Interest Rate (%)</label>
                  <input
                    type="number"
                    id="newInterestRate"
                    data-testid="new-interest-rate-input"
                    value={inputs.newInterestRate}
                    onChange={handleInputChange('newInterestRate')}
                    min="0"
                    step="0.001"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newLoanTermYears">New Loan Term (Years)</label>
                  <input
                    type="number"
                    id="newLoanTermYears"
                    data-testid="new-loan-term-input"
                    value={inputs.newLoanTermYears}
                    onChange={handleInputChange('newLoanTermYears')}
                    min="1"
                    max="50"
                    step="1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="closingCosts">Closing Costs ($)</label>
                  <input
                    type="number"
                    id="closingCosts"
                    data-testid="closing-costs-input"
                    value={inputs.closingCosts}
                    onChange={handleInputChange('closingCosts')}
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cashOut">Cash Out Amount ($)</label>
                <input
                  type="number"
                  id="cashOut"
                  data-testid="cash-out-input"
                  value={inputs.cashOut}
                  onChange={handleInputChange('cashOut')}
                  min="0"
                  step="1000"
                />
                <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Additional cash you'll receive (increases loan amount)
                </small>
              </div>

              {/* Additional Payments Section */}
              <h3 style={{ color: '#2563eb', marginTop: '2rem' }}>Additional Payments</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="extraMonthlyPayment">Extra Monthly Payment ($)</label>
                  <input
                    type="number"
                    id="extraMonthlyPayment"
                    data-testid="extra-monthly-payment-input"
                    value={inputs.extraMonthlyPayment}
                    onChange={handleInputChange('extraMonthlyPayment')}
                    min="0"
                    step="50"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="annualExtraPayment">Annual Extra Payment ($)</label>
                  <input
                    type="number"
                    id="annualExtraPayment"
                    data-testid="annual-extra-payment-input"
                    value={inputs.annualExtraPayment}
                    onChange={handleInputChange('annualExtraPayment')}
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="enableAnnualPayment"
                  data-testid="enable-annual-payment-checkbox"
                  checked={inputs.enableAnnualPayment}
                  onChange={handleInputChange('enableAnnualPayment')}
                />
                <label htmlFor="enableAnnualPayment">
                  Apply annual extra payment every January
                </label>
              </div>
            </form>
          </>
        )}

        {activeTab === 'paydown' && (
          <>
            <h2 data-testid="paydown-title">Accelerated Paydown Calculator</h2>
            <p>Calculate the impact of additional payments on your current mortgage.</p>
            
            <form data-testid="paydown-form">
              {/* Current Mortgage Info */}
              <h3 style={{ color: '#2563eb' }}>Current Mortgage Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paydownLoanAmount">Current Loan Balance ($)</label>
                  <input
                    type="number"
                    id="paydownLoanAmount"
                    data-testid="paydown-loan-amount-input"
                    value={inputs.currentLoanAmount}
                    onChange={handleInputChange('currentLoanAmount')}
                    min="1000"
                    step="1000"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="paydownInterestRate">Interest Rate (%)</label>
                  <input
                    type="number"
                    id="paydownInterestRate"
                    data-testid="paydown-interest-rate-input"
                    value={inputs.currentInterestRate}
                    onChange={handleInputChange('currentInterestRate')}
                    min="0"
                    step="0.001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="paydownRemainingYears">Remaining Years</label>
                <input
                  type="number"
                  id="paydownRemainingYears"
                  data-testid="paydown-remaining-years-input"
                  value={inputs.currentRemainingYears}
                  onChange={handleInputChange('currentRemainingYears')}
                  min="1"
                  max="50"
                  step="1"
                />
              </div>

              {/* Additional Payments */}
              <h3 style={{ color: '#059669', marginTop: '2rem' }}>Additional Payments</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paydownExtraMonthly">Extra Monthly Payment ($)</label>
                  <input
                    type="number"
                    id="paydownExtraMonthly"
                    data-testid="paydown-extra-monthly-input"
                    value={inputs.extraMonthlyPayment}
                    onChange={handleInputChange('extraMonthlyPayment')}
                    min="0"
                    step="50"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="paydownAnnualExtra">Annual Extra Payment ($)</label>
                  <input
                    type="number"
                    id="paydownAnnualExtra"
                    data-testid="paydown-annual-extra-input"
                    value={inputs.annualExtraPayment}
                    onChange={handleInputChange('annualExtraPayment')}
                    min="0"
                    step="500"
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="paydownEnableAnnual"
                  data-testid="paydown-enable-annual-checkbox"
                  checked={inputs.enableAnnualPayment}
                  onChange={handleInputChange('enableAnnualPayment')}
                />
                <label htmlFor="paydownEnableAnnual">
                  Apply annual extra payment every January
                </label>
              </div>
            </form>
          </>
        )}
      </div>

      {isCalculating && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }} data-testid="loading-indicator">
            <div className="loading"></div>
            <p>Calculating {activeTab === 'refinance' ? 'refinance' : 'paydown'} details...</p>
          </div>
        </div>
      )}

      {/* Refinance Results */}
      {results && !isCalculating && activeTab === 'refinance' && (
        <div className="results-section" data-testid="refinance-results">
          {/* Decision Summary */}
          <div className="card" style={{ 
            borderLeft: `4px solid ${isRefinanceWorthwhile ? '#22c55e' : '#ef4444'}`,
            backgroundColor: isRefinanceWorthwhile ? '#f0fdf4' : '#fef2f2'
          }}>
            <h3 data-testid="refinance-recommendation">
              {isRefinanceWorthwhile ? '✅ Refinancing Recommended' : '❌ Refinancing Not Recommended'}
            </h3>
            <p>
              {isRefinanceWorthwhile 
                ? `You could save ${formatCurrency(results.totalSavings)} over the life of the loan with a break-even period of ${formatTimePeriod(results.breakEvenMonths)}.`
                : `The closing costs and terms don't provide sufficient savings. Break-even period is ${formatTimePeriod(results.breakEvenMonths)}.`
              }
            </p>
          </div>

          {/* Comparison Results */}
          <div className="card">
            <h3>Refinance Comparison Summary</h3>
            <div className="results-grid">
              <div className="result-item" data-testid="monthly-savings">
                <h3>Monthly Savings</h3>
                <p className="value" style={{ color: results.monthlySavings >= 0 ? '#22c55e' : '#ef4444' }}>
                  {results.monthlySavings >= 0 ? '' : '-'}{formatCurrency(Math.abs(results.monthlySavings))}
                </p>
              </div>
              
              <div className="result-item" data-testid="total-interest-savings">
                <h3>Total Interest Savings</h3>
                <p className="value" style={{ color: results.totalInterestSavings >= 0 ? '#22c55e' : '#ef4444' }}>
                  {results.totalInterestSavings >= 0 ? '' : '-'}{formatCurrency(Math.abs(results.totalInterestSavings))}
                </p>
              </div>
              
              <div className="result-item" data-testid="break-even-time">
                <h3>Break-Even Time</h3>
                <p className="value">{formatTimePeriod(results.breakEvenMonths)}</p>
              </div>
              
              <div className="result-item" data-testid="payoff-time-saved">
                <h3>Payoff Time Saved</h3>
                <p className="value" style={{ color: results.payoffTimeSaved > 0 ? '#22c55e' : '#64748b' }}>
                  {results.payoffTimeSaved > 0 ? formatTimePeriod(results.payoffTimeSaved) : 'None'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button
                className="table-link"
                onClick={() => setShowCurrentSchedule(true)}
                data-testid="current-schedule-button"
                type="button"
              >
                View Current Schedule
              </button>
              <button
                className="table-link"
                onClick={() => setShowNewSchedule(true)}
                data-testid="new-schedule-button"
                type="button"
              >
                View New Schedule
              </button>
            </div>
          </div>

          {/* Comparison Chart */}
          {comparisonChartData && (
            <div className="card">
              <h3>Mortgage Balance Comparison</h3>
              <div className="chart-container" data-testid="comparison-chart">
                <Line
                  data={comparisonChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Loan Balance Over Time: Current vs New Mortgage',
                      },
                      legend: {
                        position: 'top' as const,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(Number(value)),
                        },
                      },
                    },
                  }}
                  height={300}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paydown Results */}
      {paydownResults && !isCalculating && activeTab === 'paydown' && (
        <div className="results-section" data-testid="paydown-results">
          <div className="card">
            <h3>Accelerated Paydown Results</h3>
            <div className="results-grid">
              <div className="result-item" data-testid="time-saved">
                <h3>Time Saved</h3>
                <p className="value">{formatTimePeriod(paydownResults.timeSavedMonths)}</p>
              </div>
              
              <div className="result-item" data-testid="interest-saved">
                <h3>Interest Saved</h3>
                <p className="value">{formatCurrency(paydownResults.interestSaved)}</p>
              </div>
              
              <div className="result-item" data-testid="new-payoff-date">
                <h3>New Payoff Date</h3>
                <p className="value" style={{ fontSize: '1.2rem' }}>
                  {new Date(paydownResults.payoffDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
              
              <div className="result-item" data-testid="total-payment-with-extras">
                <h3>Total Payment (w/ extras)</h3>
                <p className="value">{formatCurrency(paydownResults.monthlyPayment)}</p>
              </div>
            </div>

            <button
              className="table-link"
              onClick={() => setShowNewSchedule(true)}
              data-testid="paydown-schedule-button"
              type="button"
            >
              View Paydown Schedule
            </button>
          </div>
        </div>
      )}

      {/* Payment Schedule Modals */}
      {showCurrentSchedule && results && (
        <PaymentScheduleModal
          paymentSchedule={results.currentMortgage.paymentSchedule}
          onClose={() => setShowCurrentSchedule(false)}
        />
      )}

      {showNewSchedule && results && activeTab === 'refinance' && (
        <PaymentScheduleModal
          paymentSchedule={results.newMortgageWithExtras.paymentSchedule}
          onClose={() => setShowNewSchedule(false)}
        />
      )}

      {showNewSchedule && paydownResults && activeTab === 'paydown' && (
        <PaymentScheduleModal
          paymentSchedule={paydownResults.paymentSchedule}
          onClose={() => setShowNewSchedule(false)}
        />
      )}
    </div>
  );
};

export default RefinancePage;
