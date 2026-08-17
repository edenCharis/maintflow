from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

from core.models import TenantModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user, authenticated by email. Scoped to a Company (tenant).

    Superusers (platform staff) may have company=None; every regular user
    must belong to exactly one company and must never see another
    company's data.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Administrateur"
        MAINTENANCE_MANAGER = "maintenance_manager", "Responsable Maintenance"
        PLANNER = "planner", "Planificateur"
        TECHNICIAN = "technician", "Technicien"
        DIRECTION = "direction", "Direction"

    username = None
    email = models.EmailField(unique=True)
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
    )
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.TECHNICIAN)
    phone = models.CharField(max_length=50, blank=True)
    photo = models.ImageField(upload_to="users/photos/", blank=True, null=True)
    function = models.CharField(max_length=255, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Skill(TenantModel):
    """A technical skill or certification a technician can hold, scoped per company."""

    name = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "name"], name="unique_skill_name_per_company"
            )
        ]

    def __str__(self):
        return self.name


class TechnicianSkill(TenantModel):
    technician = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="technician_skills"
    )
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="technicians")
    certified = models.BooleanField(default=False)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["technician", "skill"], name="unique_technician_skill"
            )
        ]
