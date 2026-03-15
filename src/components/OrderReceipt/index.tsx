'use client';

import { Order, OrderItem } from '@/types';
import { forwardRef } from 'react';

interface OrderReceiptProps {
  order: Order;
  orderItems: OrderItem[];
}

const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ order, orderItems }, ref) => {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-PK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div
        ref={ref}
        className="print-receipt"
        style={{
          display: 'none',
          fontFamily: 'monospace',
          padding: '20px',
          maxWidth: '350px',
          margin: '0 auto',
          color: '#000',
          backgroundColor: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0',
              letterSpacing: '2px',
            }}
          >
            🍕 NONSTOP PIZZA
          </h1>
          <p style={{ fontSize: '11px', margin: '4px 0', color: '#666' }}>
            Fast Food Restaurant
          </p>
          <p style={{ fontSize: '11px', margin: '2px 0', color: '#666' }}>
            Phone: +92-XXX-XXXXXXX
          </p>
          <div
            style={{
              borderBottom: '2px dashed #000',
              margin: '12px 0',
            }}
          />
        </div>

        {/* Order Info */}
        <div style={{ marginBottom: '15px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Order #:</span>
            <span>{order.order_number}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Date:</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Status:</span>
            <span style={{ textTransform: 'uppercase' }}>
              {order.order_status.replace(/_/g, ' ')}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Payment:</span>
            <span>
              {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Card'} (
              {order.payment_status.toUpperCase()})
            </span>
          </div>
        </div>

        <div style={{ borderBottom: '1px dashed #999', margin: '10px 0' }} />

        {/* Customer Info */}
        <div style={{ marginBottom: '15px' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}
          >
            Customer Details
          </p>
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Name:</strong> {order.customer_name}
          </p>
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Phone:</strong> {order.customer_phone}
          </p>
          {order.customer_email && (
            <p style={{ fontSize: '12px', margin: '3px 0' }}>
              <strong>Email:</strong> {order.customer_email}
            </p>
          )}
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Address:</strong> {order.address}
          </p>
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Area:</strong> {order.area}
          </p>
          {order.landmark && (
            <p style={{ fontSize: '12px', margin: '3px 0' }}>
              <strong>Landmark:</strong> {order.landmark}
            </p>
          )}
          {order.delivery_instructions && (
            <p style={{ fontSize: '12px', margin: '3px 0' }}>
              <strong>Instructions:</strong> {order.delivery_instructions}
            </p>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed #999', margin: '10px 0' }} />

        {/* Order Items */}
        <div style={{ marginBottom: '15px' }}>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            Order Items
          </p>

          {/* Table Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 'bold',
              borderBottom: '1px solid #ccc',
              paddingBottom: '4px',
              marginBottom: '6px',
            }}
          >
            <span style={{ flex: 2 }}>Item</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Qty</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Price</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Total</span>
          </div>

          {/* Items */}
          {orderItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                marginBottom: '6px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ flex: 2 }}>
                {item.product
                  ? (item.product as unknown as { name: string }).name
                  : 'Product'}
                <br />
                <span style={{ fontSize: '10px', color: '#666' }}>
                  ({item.variant_name})
                </span>
                {item.special_instructions && (
                  <>
                    <br />
                    <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
                      &quot;{item.special_instructions}&quot;
                    </span>
                  </>
                )}
              </span>
              <span style={{ flex: 1, textAlign: 'center' }}>
                {item.quantity}
              </span>
              <span style={{ flex: 1, textAlign: 'right' }}>
                {item.unit_price}
              </span>
              <span style={{ flex: 1, textAlign: 'right' }}>
                {item.total_price}
              </span>
            </div>
          ))}
        </div>

        <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }} />

        {/* Totals */}
        <div style={{ marginBottom: '15px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span>Subtotal:</span>
            <span>Rs. {order.subtotal.toLocaleString()}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              marginBottom: '4px',
            }}
          >
            <span>Delivery Fee:</span>
            <span>Rs. {order.delivery_fee.toLocaleString()}</span>
          </div>
          <div
            style={{
              borderBottom: '1px solid #000',
              margin: '6px 0',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            <span>TOTAL:</span>
            <span>Rs. {order.total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }} />

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold' }}>
            Thank you for your order! 🍕
          </p>
          <p style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            NonStop Pizza — Fresh & Hot, Always!
          </p>
          <p style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>
            --- This is a computer generated receipt ---
          </p>
        </div>
      </div>
    );
  }
);

OrderReceipt.displayName = 'OrderReceipt';

export default OrderReceipt;