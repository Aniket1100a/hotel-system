from django.db import models


class TableSection(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class DiningTable(models.Model):
    class Status(models.TextChoices):
        FREE = 'FREE', 'Free'
        OCCUPIED = 'OCCUPIED', 'Occupied'
        RESERVED = 'RESERVED', 'Reserved'

    number = models.CharField(max_length=10, unique=True)
    capacity = models.PositiveIntegerField(default=4)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.FREE)
    section = models.ForeignKey(TableSection, on_delete=models.SET_NULL, null=True, related_name='tables')

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Table {self.number} ({self.status})"
