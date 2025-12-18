# models/base.py
from django.db import models


class SoftDeleteManager(models.Manager):
    """Custom manager to filter out soft deleted records"""
    def get_queryset(self):
        return super().get_queryset().filter(record_state='active')


class SoftDeleteModel(models.Model):
    """Abstract base model for soft delete functionality"""
    RECORD_STATE_CHOICES = (
        ('active', 'Active'),
        ('deleted', 'Deleted'),
    )
    
    record_state = models.CharField(
        max_length=10, 
        choices=RECORD_STATE_CHOICES, 
        default='active'
    )
    
    # Managers
    objects = SoftDeleteManager()  # Only returns active records
    all_objects = models.Manager()  # Returns all records including deleted
    
    class Meta:
        abstract = True
    
    def soft_delete(self):
        """Soft delete the record"""
        self.record_state = 'deleted'
        self.save()
    
    def restore(self):
        """Restore a soft deleted record"""
        self.record_state = 'active'
        self.save()
    
    def is_deleted(self):
        """Check if record is soft deleted"""
        return self.record_state == 'deleted'