import React from 'react';
import { formatCurrency, type PaymentScheduleItem } from '../utils/mortgageCalculations';

interface PaymentScheduleModalProps {
  paymentSchedule: PaymentScheduleItem[];
  onClose: () => void;
}

const PaymentScheduleModal: React.FC<PaymentScheduleModalProps> = ({
  paymentSchedule,
  onClose,
}) => {
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      data-testid="payment-schedule-modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        }}
      >
        <div 
          style={{
            padding: '2rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 data-testid="modal-title">Payment Schedule</h2>
          <button
            onClick={onClose}
            data-testid="close-modal-button"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              color: '#64748b',
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <div
          style={{
            overflow: 'auto',
            maxHeight: 'calc(90vh - 120px)',
            padding: '0 2rem 2rem 2rem',
          }}
        >
          <div style={{ marginBottom: '1rem', color: '#64748b' }}>
            Total payments: {paymentSchedule.length}
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table
              data-testid="payment-schedule-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={headerStyle}>Payment #</th>
                  <th style={headerStyle}>Date</th>
                  <th style={headerStyle}>Principal</th>
                  <th style={headerStyle}>Interest</th>
                  <th style={headerStyle}>Total Payment</th>
                  <th style={headerStyle}>Remaining Balance</th>
                  <th style={headerStyle}>Cumulative Interest</th>
                </tr>
              </thead>
              <tbody>
                {paymentSchedule.map((payment, index) => (
                  <tr
                    key={payment.paymentNumber}
                    data-testid={`payment-row-${payment.paymentNumber}`}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    }}
                  >
                    <td style={cellStyle} data-testid={`payment-number-${payment.paymentNumber}`}>
                      {payment.paymentNumber}
                    </td>
                    <td style={cellStyle} data-testid={`payment-date-${payment.paymentNumber}`}>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right' }} data-testid={`principal-${payment.paymentNumber}`}>
                      {formatCurrency(payment.principalPayment)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right' }} data-testid={`interest-${payment.paymentNumber}`}>
                      {formatCurrency(payment.interestPayment)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: '600' }} data-testid={`total-payment-${payment.paymentNumber}`}>
                      {formatCurrency(payment.totalPayment)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right' }} data-testid={`remaining-balance-${payment.paymentNumber}`}>
                      {formatCurrency(payment.remainingBalance)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right' }} data-testid={`cumulative-interest-${payment.paymentNumber}`}>
                      {formatCurrency(payment.cumulativeInterest)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  fontWeight: '600',
  color: '#374151',
  borderBottom: '2px solid #d1d5db',
};

const cellStyle: React.CSSProperties = {
  padding: '0.75rem',
  textAlign: 'left',
  color: '#1f2937',
};

export default PaymentScheduleModal;