from rest_framework import serializers

from companies.models import Company, Location, Site


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "logo",
            "address",
            "phone",
            "email",
            "country",
            "currency",
            "timezone",
            "is_active",
            "settings",
        ]
        read_only_fields = ["id"]


class SiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Site
        fields = ["id", "company", "name", "code", "address", "description", "manager", "status"]
        read_only_fields = ["id", "company"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "company", "site", "parent", "name", "code", "description"]
        read_only_fields = ["id", "company"]
