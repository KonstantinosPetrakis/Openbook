# Generated by Django 5.0.7 on 2024-07-29 16:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='channel',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
