import os
import django
import shutil
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.billing.models import Invoice
from apps.staff.models import StaffPayment, Attendance
from apps.inventory.models import StockLog

def sync_file(source_file, target_path):
    """Safely copies a file from source to target if target doesn't exist."""
    if not source_file or not source_file.name:
        return False

    src = Path(source_file.path)
    if not src.exists():
        return False

    target_path.parent.mkdir(parents=True, exist_ok=True)
    if not target_path.exists():
        shutil.copy2(src, target_path)
        return True
    return False

def export_to_local_container():
    # Target folder in project root
    base_dir = Path(__file__).resolve().parent.parent / 'BILL_STORAGE'
    base_dir.mkdir(exist_ok=True)

    print(f"Syncing data to local container: {base_dir}")

    # 1. Sync Invoices (Text Receipts)
    bill_count = 0
    for inv in Invoice.objects.all():
        date_folder = base_dir / inv.created_at.strftime('%Y-%m-%d') / 'Bills'
        date_folder.mkdir(parents=True, exist_ok=True)

        safe_bill_no = (inv.bill_no or str(inv.id)).replace(' ', '_')
        file_path = date_folder / f"Bill_{safe_bill_no}.txt"

        if not file_path.exists():
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(inv.receipt_copy or "No digital copy available.")
            bill_count += 1

    # 2. Sync Staff Payments (Attachments)
    staff_pay_count = 0
    for pay in StaffPayment.objects.filter(attachment__isnull=False):
        date_folder = base_dir / pay.payment_date.strftime('%Y-%m-%d') / 'Staff_Payments'
        target_name = f"Pay_{pay.user.username}_{pay.id}_{Path(pay.attachment.name).name}"
        if sync_file(pay.attachment, date_folder / target_name):
            staff_pay_count += 1

    # 3. Sync Attendance (Attachments)
    attendance_count = 0
    for att in Attendance.objects.filter(attachment__isnull=False):
        date_folder = base_dir / att.date.strftime('%Y-%m-%d') / 'Attendance_Proofs'
        target_name = f"Att_{att.user.username}_{att.id}_{Path(att.attachment.name).name}"
        if sync_file(att.attachment, date_folder / target_name):
            attendance_count += 1

    # 4. Sync Inventory/Stock Logs (Attachments)
    stock_count = 0
    for log in StockLog.objects.filter(attachment__isnull=False):
        date_folder = base_dir / log.created_at.strftime('%Y-%m-%d') / 'Stock_Bills'
        target_name = f"Stock_{log.item.name}_{log.id}_{Path(log.attachment.name).name}"
        if sync_file(log.attachment, date_folder / target_name):
            stock_count += 1

    print(f"--- Sync Report ---")
    print(f"New Digital Receipts: {bill_count}")
    print(f"New Staff Payment Proofs: {staff_pay_count}")
    print(f"New Attendance Proofs: {attendance_count}")
    print(f"New Inventory Bills: {stock_count}")
    print(f"-------------------")

if __name__ == "__main__":
    export_to_local_container()
