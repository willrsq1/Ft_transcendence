from django.db import models
from django.utils import timezone


class JankenGameCreation(models.Model):
    creator = models.IntegerField(default=-1)
    isWaiting = models.BooleanField(default=False)

    def __str__(self):
        return self.creator + " created a Janken Game"
    
    def findGame():
        return JankenGameCreation.objects.all().first() | None
    
    def getMyGameCreation(profile):
        if JankenGameCreation.objects.filter(creator=profile).exists():
            return JankenGameCreation.objects.get(creator=profile)
        else:
            return None
        
    def matchMaking(user_id):
        if JankenGameCreation.objects.all().exists():
            myWinrate = FinishedJankenGames.getWinrate(user_id)
            for margin in range(0, 101, 5):
                for game in JankenGameCreation.objects.all():
                    if FinishedJankenGames.getWinrate(game.creator) >= myWinrate - margin and FinishedJankenGames.getWinrate(game.creator) <= myWinrate + margin:
                        return game
            return JankenGameCreation.objects.all().first()
        return None
    
    class Meta:
        verbose_name = "Janken Game Creation"
        verbose_name_plural = "Janken Game Creations"

class JankenGameInProgress(models.Model):
    creator = models.IntegerField(default=-1)
    opponent = models.IntegerField(default=-1)
    creator_choice = models.CharField(max_length=100, default="None")
    opponent_choice = models.CharField(max_length=100, default="None")
    game_finished = models.BooleanField(default=False)
    to_delete_creator = models.BooleanField(default=False)
    to_delete_opponent = models.BooleanField(default=False)
    result = models.CharField(max_length=100, default="None")
    completion_time = models.DateTimeField(null=True, blank=True)
    loser = models.IntegerField(default=-1)
    winner = models.IntegerField(default=-1)
    first_input_time = models.DateTimeField(default=None, null=True, blank=True)
    first_input_nickname = models.IntegerField(default=-1)

    def __str__(self):
        return self.creator + " vs " + self.opponent
    
    class Meta:
        verbose_name = "Janken Game In Progress"
        verbose_name_plural = "Janken Games In Progress"
    
    def myGame(profile):
        return JankenGameInProgress.objects.filter(creator=profile) | JankenGameInProgress.objects.filter(opponent=profile)
    
    def getMyGame(profile):
        if JankenGameInProgress.objects.filter(creator=profile).exists():
            return JankenGameInProgress.objects.get(creator=profile)
        elif JankenGameInProgress.objects.filter(opponent=profile).exists():
            return JankenGameInProgress.objects.get(opponent=profile)
        else:
            return None
    
    def giveInput(choice, Profile):
        if JankenGameInProgress.objects.filter(creator=Profile).exists():
            game = JankenGameInProgress.objects.get(creator=Profile)
            game.creator_choice = choice
            if game.opponent_choice != "None":
                game.game_finished = True
                game.completion_time = timezone.now()
            else:
                game.first_input_time = timezone.now()
                game.first_input_nickname = Profile
            game.save()
        elif JankenGameInProgress.objects.filter(opponent=Profile).exists():
            game = JankenGameInProgress.objects.get(opponent=Profile)
            game.opponent_choice = choice
            if game.creator_choice != "None":
                game.game_finished = True
                game.completion_time = timezone.now()
            else:
                game.first_input_time = timezone.now()
                game.first_input_nickname = Profile
            game.save()
        else:
            return None
        
    def addToHistory(self):
        if self.result == "draw":
            FinishedJankenGames.objects.create(owner=self.creator, opponent=self.opponent, owner_choice=self.creator_choice, opponent_choice=self.opponent_choice, result=self.result, completion_time=self.completion_time, loser=self.loser, winner=self.winner)
            FinishedJankenGames.objects.create(owner=self.opponent, opponent=self.creator, owner_choice=self.opponent_choice, opponent_choice=self.creator_choice, result=self.result, completion_time=self.completion_time, loser=self.loser, winner=self.winner)
        elif self.winner == self.creator:
            FinishedJankenGames.objects.create(owner=self.creator, opponent=self.opponent, owner_choice=self.creator_choice, opponent_choice=self.opponent_choice, result="Victory", completion_time=self.completion_time, loser=self.loser, winner=self.winner)
            FinishedJankenGames.objects.create(owner=self.opponent, opponent=self.creator, owner_choice=self.opponent_choice, opponent_choice=self.creator_choice, result="Defeat", completion_time=self.completion_time, loser=self.loser, winner=self.winner)
        elif self.winner == self.opponent:
            FinishedJankenGames.objects.create(owner=self.creator, opponent=self.opponent, owner_choice=self.creator_choice, opponent_choice=self.opponent_choice, result="Defeat", completion_time=self.completion_time, loser=self.loser, winner=self.winner)
            FinishedJankenGames.objects.create(owner=self.opponent, opponent=self.creator, owner_choice=self.opponent_choice, opponent_choice=self.creator_choice, result="Victory", completion_time=self.completion_time, loser=self.loser, winner=self.winner)
        self.delete()

        

class FinishedJankenGames(models.Model):
    owner = models.IntegerField(default=-1)
    opponent = models.IntegerField(default=-1)
    owner_choice = models.CharField(max_length=100)
    opponent_choice = models.CharField(max_length=100)
    result = models.CharField(max_length=100)
    completion_time = models.DateTimeField()
    loser = models.IntegerField(default=-1)
    winner = models.IntegerField(default=-1)

    def __str__(self):
        return self.owner + " " + self.result
    
    class Meta:
        verbose_name = "Finished Janken Game"
        verbose_name_plural = "Finished Janken Games"
    
    def getMyHistory(profile):
        return FinishedJankenGames.objects.filter(owner=profile)
    
    def countWins(profile):
        return FinishedJankenGames.objects.filter(owner=profile, result="Victory").count()
    
    def countLosses(profile):
        return FinishedJankenGames.objects.filter(owner=profile, result="Defeat").count()
    
    def countDraws(profile): #return 0 if no game found
        return FinishedJankenGames.objects.filter(owner=profile, result="draw").count()
    
    def getWinrate(user_id):
        if FinishedJankenGames.objects.filter(owner=user_id).exists():
            return FinishedJankenGames.objects.filter(owner=user_id, result="Victory").count() / FinishedJankenGames.objects.filter(owner=user_id).count() * 100
        else:
            return 0
    
    def getMostPlayed(user_id):
        if not FinishedJankenGames.objects.filter(owner=user_id).exists():
            return "Never played"
        count_rock = 0
        count_paper = 0
        count_scissors = 0
        if FinishedJankenGames.objects.filter(owner=user_id, owner_choice="rock").exists():
            count_rock = FinishedJankenGames.objects.filter(owner=user_id, owner_choice="rock").count()
        if FinishedJankenGames.objects.filter(owner=user_id, owner_choice="paper").exists():
            count_paper = FinishedJankenGames.objects.filter(owner=user_id, owner_choice="paper").count()
        if FinishedJankenGames.objects.filter(owner=user_id, owner_choice="scissors").exists():
            count_scissors = FinishedJankenGames.objects.filter(owner=user_id, owner_choice="scissors").count()
        if count_rock >= count_scissors and count_rock >= count_paper:
            return "rock"
        elif count_paper >= count_rock and count_paper >= count_scissors:
            return "paper"
        else:
            return "scissors"

