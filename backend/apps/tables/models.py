from django.db import models


class DiningTable(models.Model):
    class Status(models.TextChoices):
        FREE = 'FREE', 'Free'
        OCCUPIED = 'OCCUPIED', 'Occupied'
        RESERVED = 'RESERVED', 'Reserved'

    number = models.CharField(max_length=10, unique=True)
    capacity = models.PositiveIntegerField(default=4)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.FREE)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Table {self.number} ({self.status})"
