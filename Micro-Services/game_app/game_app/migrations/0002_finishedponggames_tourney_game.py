# Generated by Django 5.0.1 on 2024-04-02 15:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game_app', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='finishedponggames',
            name='tourney_game',
            field=models.BooleanField(default=False),
        ),
    ]