from django.db import models

class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

class RolePermission(models.Model):
    feature_id = models.CharField(max_length=100, unique=True)
    feature_name = models.CharField(max_length=100)

    can_admin = models.BooleanField(default=True)
    can_manager = models.BooleanField(default=False)
    can_waiter = models.BooleanField(default=False)
    can_biller = models.BooleanField(default=False)
    can_kitchen = models.BooleanField(default=False)

    def __str__(self):
        return self.feature_name

class UserFeatureOverride(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='feature_overrides')
    feature_id = models.CharField(max_length=100)
    is_enabled = models.BooleanField(default=True)

    class Meta:
        unique_together = ['user', 'feature_id']

    def __str__(self):
        return f"{self.user.username} - {self.feature_id}: {'ON' if self.is_enabled else 'OFF'}"
