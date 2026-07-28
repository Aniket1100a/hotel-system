/**
 * Utility to handle direct thermal printing by generating a temporary window
 */

export interface PrintItem {
  menu_item_name: string;
  quantity: number;
  subtotal: string | number;
}

export interface PrintData {
  id: number;
  table_number: string;
  billed_by_name: string;
  subtotal: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  created_at: string;
  items: PrintItem[];
}

export const printDirectly = (data: PrintData) => {
  const windowUrl = 'about:blank';
  const uniqueName = new Date();
  const windowName = 'Print' + uniqueName.getTime();
  const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

  if (!printWindow) {
    alert("Please allow popups to print the bill.");
    return;
  }

  const html = `
    <html>
      <head>
        <title>Print Bill #${data.id}</title>
        <style>
          @page { margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            margin: 0;
            padding: 5mm;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          .text-right { text-align: right; }
          .footer { margin-top: 10px; font-size: 10px; }
          .big { font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="center">
          <p class="bold big" style="margin: 0;">HOTEL CHATURTHI</p>
          <p class="bold" style="margin: 0;">PURE VEG RESTAURANT</p>
          <p style="font-size: 10px; margin: 2px 0;">Dhule-Solapur Highway, Vashi</p>
          <div class="divider"></div>
          <p class="bold">TAX INVOICE</p>
        </div>

        <div style="font-size: 11px; margin: 10px 0;">
          <p style="margin: 2px 0;">INV: #${data.id} | TBL: ${data.table_number}</p>
          <p style="margin: 2px 0;">DATE: ${new Date(data.created_at).toLocaleString()}</p>
          <p style="margin: 2px 0;">CASHIER: ${data.billed_by_name}</p>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr class="bold">
              <td style="width: 60%">ITEM</td>
              <td class="text-right">QTY</td>
              <td class="text-right">AMT</td>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td>${item.menu_item_name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${parseFloat(item.subtotal.toString()).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <table>
          <tbody>
            <tr>
              <td class="bold">SUBTOTAL</td>
              <td class="text-right bold">₹${parseFloat(data.subtotal.toString()).toFixed(2)}</td>
            </tr>
            <tr>
              <td>CGST (2.5%)</td>
              <td class="text-right">₹${(parseFloat(data.tax_amount.toString()) / 2).toFixed(2)}</td>
            </tr>
            <tr>
              <td>SGST (2.5%)</td>
              <td class="text-right">₹${(parseFloat(data.tax_amount.toString()) / 2).toFixed(2)}</td>
            </tr>
            ${parseFloat(data.discount_amount.toString()) > 0 ? `
              <tr style="color: #000;">
                <td>DISCOUNT</td>
                <td class="text-right">-₹${parseFloat(data.discount_amount.toString()).toFixed(2)}</td>
              </tr>
            ` : ''}
            <tr class="bold big">
              <td>TOTAL</td>
              <td class="text-right">₹${parseFloat(data.total_amount.toString()).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="center footer">
          <p class="bold">THANK YOU! VISIT AGAIN</p>
          <p>Developed by Vinay</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
