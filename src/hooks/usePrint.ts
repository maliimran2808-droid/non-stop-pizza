'use client';

import { useRef, useCallback } from 'react';

export const usePrint = () => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return;

    const printContent = receiptRef.current.innerHTML;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order Receipt - NonStop Pizza</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 10px;
              max-width: 350px;
              margin: 0 auto;
              color: #000;
              background: #fff;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }, []);

  return { receiptRef, handlePrint };
};