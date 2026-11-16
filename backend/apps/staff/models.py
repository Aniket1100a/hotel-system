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

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.status})"

class StaffPayment(models.Model):
    class PaymentType(models.TextChoices):
        SALARY = 'SALARY', 'Salary'
        ADVANCE = 'ADVANCE', 'Advance'
        BONUS = 'BONUS', 'Bonus'
        INCENTIVE = 'INCENTIVE', 'Incentive'

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
