/**
 * Utility to handle direct thermal printing by generating a temporary window
 * Matches the layout of the provided reference image precisely.
 */

export interface PrintItem {
  menu_item_name: string;
  quantity: number;
  price_at_order: string | number;
  subtotal: string | number;
}

export interface PrintData {
  id: number;
  bill_no?: string;
  table_number: string;
  billed_by_name: string;
  subtotal: string | number;
  tax_amount: string | number;
  discount_amount: string | number;
  total_amount: string | number;
  payment_method?: string;
  waiter_name?: string;
  order_type?: 'DINE_IN' | 'TAKEAWAY';
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

  const dateObj = new Date(data.created_at);
  const formattedDate = dateObj.toLocaleDateString('en-GB'); // DD/MM/YY
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const totalQty = data.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const html = `
    <html>
      <head>
        <title>Print Bill ${data.bill_no || `#${data.id}`}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          html, body {
            margin: 0;
            padding: 0;
            width: 80mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            padding: 2mm 3mm;
            font-size: 14px;
            line-height: 1.2;
            color: #000;
            box-sizing: border-box;
            overflow-x: hidden;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .divider-solid { border-top: 1px solid #000; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 2px 0; table-layout: fixed; }
          td, th { overflow: hidden; }
          .text-right { text-align: right; }
          .footer { margin-top: 15px; font-size: 14px; }
          .big { font-size: 18px; }
          .header-address { font-size: 13px; font-weight: bold; line-height: 1.2; }
          .meta-table td { padding: 1px 0; vertical-align: top; font-size: 14px; white-space: nowrap; overflow: visible; }
          .items-table th { padding: 4px 0; border-bottom: 1px dashed #000; font-weight: bold; }
          .items-table td { padding: 4px 0; vertical-align: top; white-space: normal; word-break: break-word; }
        </style>
      </head>
      <body>
        <div class="center">
          <p class="bold big" style="margin: 0 0 4px 0;">HOTEL CHATURTHI</p>
          <p class="header-address" style="margin: 0;">Solapur - Dhule highway</p>
          <p class="header-address" style="margin: 0;">Ghatpimpri Phata</p>
          <p class="header-address" style="margin: 0;">Mob No : 9850066337</p>
        </div>

        <div class="divider"></div>

        <table class="meta-table">
          <tr>
            <td style="width: 40%;">Date: ${formattedDate}</td>
            <td style="width: 60%; font-weight: bold; text-align: right;">
              ${data.order_type === 'TAKEAWAY' ? 'TAKEAWAY' : `Dine In: ${data.table_number}`}
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top;">${formattedTime}</td>
            <td style="text-align: right; white-space: normal; word-break: break-all;">
              <span style="font-size: 14px;">Bill No:</span>
              <span style="font-size: 15px; font-weight: bold;">${data.bill_no || data.id}</span>
            </td>
          </tr>
          <tr>
            <td>Cashier: ${data.billed_by_name}</td>
            <td></td>
          </tr>
          ${data.waiter_name ? `
            <tr>
              <td>Waiter : ${data.waiter_name}</td>
              <td></td>
            </tr>
          ` : ''}
        </table>

        <div class="divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%; text-align: left;">No.</th>
              <th style="width: 37%; text-align: left;">Item</th>
              <th style="width: 12%; text-align: right; padding-right: 5px;">Qty</th>
              <th style="width: 20%; text-align: right; padding-right: 5px;">Price</th>
              <th style="width: 23%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map((item, index) => `
              <tr>
                <td style="text-align: left;">${index + 1}</td>
                <td style="text-align: left; overflow: visible; white-space: normal; word-break: break-word;">${item.menu_item_name}</td>
                <td style="text-align: right; font-weight: bold; padding-right: 5px;">${item.quantity}</td>
                <td style="text-align: right; padding-right: 5px;">${parseFloat(item.price_at_order.toString()).toFixed(2)}</td>
                <td style="text-align: right;">${parseFloat(item.subtotal.toString()).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="divider"></div>

        <table style="margin-bottom: 4px; table-layout: auto;">
          <tr>
            <td style="font-weight: bold; font-size: 15px; white-space: nowrap;">Total Qty: ${totalQty}</td>
            <td style="text-align: right; font-weight: bold;">Sub Total</td>
            <td style="text-align: right; font-weight: bold; width: 80px;">${parseFloat(data.subtotal.toString()).toFixed(2)}</td>
          </tr>
        </table>

        <div class="divider-solid" style="border-top-width: 2px;"></div>

        <table style="table-layout: auto;">
          <tr style="font-weight: bold;">
            <td style="text-align: right; font-size: 18px; vertical-align: middle; padding-right: 10px;">Grand Total</td>
            <td style="text-align: right; font-size: 24px; white-space: nowrap;">₹${parseFloat(data.total_amount.toString()).toFixed(2)}</td>
          </tr>
        </table>

        <table style="margin-top: 4px;">
          <tr>
            <td style="font-size: 12px; font-weight: bold;">Payment Mode: ${data.payment_method || 'CASH'}</td>
          </tr>
        </table>

        <div class="divider-solid" style="border-top-width: 2px;"></div>

        <div class="center footer">
          <p class="bold" style="margin: 0;">Thanks & Visit Again...!</p>
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
