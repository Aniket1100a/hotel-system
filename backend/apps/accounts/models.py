from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user with a role, so the same login system serves the React
    admin panel (admin/biller) and the Flutter waiter app (waiter/kitchen).
    """

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MANAGER = 'MANAGER', 'Manager'
        WAITER = 'WAITER', 'Waiter'
        BILLER = 'BILLER', 'Biller / Cashier'
        KITCHEN = 'KITCHEN', 'Kitchen Staff'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.WAITER)
    phone_number = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
