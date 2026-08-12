from django.db import models
from django.conf import settings

class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        LEAVE = 'LEAVE', 'On Leave'
        HALFDAY = 'HALF', 'Half Day'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PRESENT)
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to='attendance_proofs/', null=True, blank=True)
    total_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if self.check_in and self.check_out:
            from datetime import datetime, date
            # Convert to datetime to calculate difference
            dummy_date = date(2000, 1, 1)
            t1 = datetime.combine(dummy_date, self.check_in)
            t2 = datetime.combine(dummy_date, self.check_out)

            # Handle cases where shift crosses midnight (though unlikely for 8hr shift)
            if t2 < t1:
                from datetime import timedelta
                t2 += timedelta(days=1)

            diff = t2 - t1
            total_seconds = diff.total_seconds()
            hours = total_seconds / 3600

            self.total_hours = round(hours, 2)

            # 8 hours is standard. Anything above is overtime.
            if hours > 8:
                self.overtime_hours = round(hours - 8, 2)
            else:
                self.overtime_hours = 0
        else:
            self.total_hours = 0
            self.overtime_hours = 0

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.status})"

class StaffPayment(models.Model):
    class PaymentType(models.TextChoices):
        SALARY = 'SALARY', 'Salary'
        ADVANCE = 'ADVANCE', 'Advance'
        BONUS = 'BONUS', 'Bonus'
        INCENTIVE = 'INCENTIVE', 'Incentive'
        OVERTIME = 'OVERTIME', 'Overtime'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_type = models.CharField(max_length=10, choices=PaymentType.choices, default=PaymentType.SALARY)
    notes = models.TextField(blank=True)
    attachment = models.FileField(upload_to='staff_payments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date']

    def __str__(self):
        return f"{self.user.username} - {self.payment_type} - {self.amount}"

class StaffProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    address = models.TextField(blank=True)
    joining_date = models.DateField(null=True, blank=True)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    # New optional fields
    id_proof_number = models.CharField(max_length=50, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    overtime_rate_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Profile for {self.user.username}"
