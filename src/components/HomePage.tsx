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
  calculateMortgageDetails,
  validateMortgageInputs,
  formatCurrency,
  generateChartData,
  type MortgageInputs,
  type MortgageResults,
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

const HomePage: React.FC = () => {
  const [inputs, setInputs] = useState<MortgageInputs>({
    loanAmount: 400000,
    interestRate: 6.5,
    loanTermYears: 30,
    propertyTax: 8000,
    homeInsurance: 1200,
    pmi: 0,
    hoaFees: 0,
  });

  const [results, setResults] = useState<MortgageResults | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: keyof MortgageInputs) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value) || 0;
    setInputs(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateMortgage = () => {
    setIsCalculating(true);
    
    // Add small delay to show loading state for better UX
    setTimeout(() => {
      const validationErrors = validateMortgageInputs(inputs);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setResults(null);
      } else {
        setErrors([]);
        const mortgageResults = calculateMortgageDetails(inputs);
        setResults(mortgageResults);
      }
      
      setIsCalculating(false);
    }, 300);
  };

  // Auto-calculate when inputs change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputs.loanAmount > 0 && inputs.interestRate >= 0 && inputs.loanTermYears > 0) {
        calculateMortgage();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputs]);

  const chartData = useMemo(() => {
    if (!results) return null;

    const data = generateChartData(results.paymentSchedule);
    const years = Math.ceil(data.length / 12);
    
    // Sample data points for better performance (show every 12th month for long-term loans)
    const sampleRate = data.length > 120 ? 12 : 1;
    const sampledData = data.filter((_, index) => index % sampleRate === 0 || index === data.length - 1);

    return {
      labels: sampledData.map(d => `Year ${Math.ceil(d.month / 12)}`),
      datasets: [
        {
          label: 'Principal Payment',
          data: sampledData.map(d => d.principal),
          borderColor: 'rgb(37, 99, 235)',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Interest Payment',
          data: sampledData.map(d => d.interest),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }, [results]);

  const balanceChartData = useMemo(() => {
    if (!results) return null;

    const data = generateChartData(results.paymentSchedule);
    const sampleRate = data.length > 120 ? 12 : 6;
    const sampledData = data.filter((_, index) => index % sampleRate === 0 || index === data.length - 1);

    return {
      labels: sampledData.map(d => `Year ${Math.ceil(d.month / 12)}`),
      datasets: [
        {
          label: 'Remaining Balance',
          data: sampledData.map(d => d.balance),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
        },
      ],
    };
  }, [results]);

  return (
    <div className="container" data-testid="home-page">
      <div className="card">
        <h2 data-testid="calculator-title">Mortgage Payment Calculator</h2>
        
        {errors.length > 0 && (
          <div className="error-message" data-testid="error-messages">
            <ul>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form data-testid="calculator-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="loanAmount">Loan Amount ($)</label>
              <input
                type="number"
                id="loanAmount"
                data-testid="loan-amount-input"
                value={inputs.loanAmount}
                onChange={handleInputChange('loanAmount')}
                min="1000"
                max="10000000"
                step="1000"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="interestRate">Annual Interest Rate (%)</label>
              <input
                type="number"
                id="interestRate"
                data-testid="interest-rate-input"
                value={inputs.interestRate}
                onChange={handleInputChange('interestRate')}
                min="0"
                max="50"
                step="0.001"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="loanTermYears">Loan Term (Years)</label>
              <input
                type="number"
                id="loanTermYears"
                data-testid="loan-term-input"
                value={inputs.loanTermYears}
                onChange={handleInputChange('loanTermYears')}
                min="1"
                max="50"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="propertyTax">Annual Property Tax ($)</label>
              <input
                type="number"
                id="propertyTax"
                data-testid="property-tax-input"
                value={inputs.propertyTax}
                onChange={handleInputChange('propertyTax')}
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="homeInsurance">Annual Home Insurance ($)</label>
              <input
                type="number"
                id="homeInsurance"
                data-testid="home-insurance-input"
                value={inputs.homeInsurance}
                onChange={handleInputChange('homeInsurance')}
                min="0"
                step="100"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="pmi">Annual PMI ($)</label>
              <input
                type="number"
                id="pmi"
                data-testid="pmi-input"
                value={inputs.pmi}
                onChange={handleInputChange('pmi')}
                min="0"
                step="100"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="hoaFees">Annual HOA Fees ($)</label>
            <input
              type="number"
              id="hoaFees"
              data-testid="hoa-fees-input"
              value={inputs.hoaFees}
              onChange={handleInputChange('hoaFees')}
              min="0"
              step="100"
            />
          </div>
        </form>
      </div>

      {isCalculating && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }} data-testid="loading-indicator">
            <div className="loading"></div>
            <p>Calculating mortgage details...</p>
          </div>
        </div>
      )}

      {results && !isCalculating && (
        <div className="results-section" data-testid="results-section">
          <div className="card">
            <h3>Payment Summary</h3>
            <div className="results-grid">
              <div className="result-item" data-testid="monthly-payment">
                <h3>Total Monthly Payment</h3>
                <p className="value">{formatCurrency(results.monthlyPayment)}</p>
              </div>
              
              <div className="result-item" data-testid="principal-interest">
                <h3>Principal & Interest</h3>
                <p className="value">{formatCurrency(results.monthlyPrincipalAndInterest)}</p>
              </div>
              
              <div className="result-item" data-testid="total-interest">
                <h3>Total Interest Paid</h3>
                <p className="value">{formatCurrency(results.totalInterest)}</p>
              </div>
              
              <div className="result-item" data-testid="total-payments">
                <h3>Total of All Payments</h3>
                <p className="value">{formatCurrency(results.totalPayments)}</p>
              </div>
            </div>

            <button
              className="table-link"
              onClick={() => setShowPaymentSchedule(true)}
              data-testid="payment-schedule-button"
              type="button"
            >
              View Payment Schedule Table
            </button>
          </div>

          {chartData && (
            <div className="card">
              <h3>Principal vs Interest Over Time</h3>
              <div className="chart-container" data-testid="payment-chart">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Monthly Principal and Interest Payments',
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
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                  }}
                  height={300}
                />
              </div>
            </div>
          )}

          {balanceChartData && (
            <div className="card">
              <h3>Loan Balance Over Time</h3>
              <div className="chart-container" data-testid="balance-chart">
                <Bar
                  data={balanceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Remaining Loan Balance',
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

      {showPaymentSchedule && results && (
        <PaymentScheduleModal
          paymentSchedule={results.paymentSchedule}
          onClose={() => setShowPaymentSchedule(false)}
        />
      )}
    </div>
  );
};

export default HomePage;