from django.http import JsonResponse
from rest_framework.views import APIView
from .models import JankenGameCreation, JankenGameInProgress, FinishedJankenGames
from django.http import JsonResponse




#JANKEN GAME

class createJankenGameAPIView(APIView): #create a gamecreation and wait for an opponent
    def get(self, request, *args, **kwargs):
        try:
            if (JankenGameCreation.objects.filter(creator=request.user_id).exists() == True):
                raise Exception("You are already waiting for an opponent")
            if (JankenGameInProgress.myGame(request.user_id).exists() == True):
                raise Exception("You are already playing a game")
            game = JankenGameCreation.objects.create(creator=request.user_id)
            game.save()
            return JsonResponse({'game_id': game.id})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

class gameInProgressAPIView(APIView): #check your game status
    def get(self, request, *args, **kwargs):
        try:
            game = JankenGameInProgress.getMyGame(request.user_id)
            if game is None:
                if JankenGameCreation.objects.filter(creator=request.user_id).exists() == False:
                    raise Exception('You are not part of a game, please create one or join one')
                return JsonResponse({'message': 'waiting for opponent'})
            if game.game_finished == True:
                return JsonResponse({'message': 'game finished'})
            if game.creator == request.user_id:
                if game.creator_choice != "None":
                    return JsonResponse({'message': 'already played', 'opponent': game.opponent})
                return JsonResponse({'message': 'game in progress', 'opponent': game.opponent})
            if game.opponent == request.user_id:
                if game.opponent_choice != "None":
                    return JsonResponse({'message': 'already played', 'opponent': game.creator}) 
                return JsonResponse({'message': 'game in progress', 'opponent': game.creator})
            raise Exception('You are not part of a game')
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})


class jankenGameAPIView(APIView): #find an ennemy, matchmaking
    def get(self, request, *args, **kwargs):
        try:
            if (JankenGameCreation.objects.filter(creator=request.user_id).exists() == True):
                raise Exception("You already have a game creation waiting for an opponent")
            if (JankenGameInProgress.getMyGame(request.user_id) != None):
                raise Exception("You already have a game in progress")
            if (JankenGameCreation.objects.all().exists() == False):
                raise Exception("No game available")
            game = JankenGameCreation.matchMaking(request.user_id)
            JankenGameInProgress.objects.create(creator=game.creator, opponent=request.user_id)
            game.delete()
            return JsonResponse({'game_id': game.id})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})
        
    def post(self, request, *args, **kwargs): #play your move
        try:
            game = JankenGameInProgress.getMyGame(request.user_id)
            if game is None:
                raise Exception("You are not part of a game")
            if game.creator == request.user_id and game.creator_choice != "None":
                raise Exception("You already gave your input")
            if game.opponent == request.user_id and game.opponent_choice != "None":
                raise Exception("You already gave your input")
            JankenGameInProgress.giveInput(request.data.get('input', 'rock'), request.user_id)
            return JsonResponse({'message': 'success'})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

class waitForResultsAPIView(APIView): #waiting for the game to be finished
    def get(self, request, *args, **kwargs):
        try:
            game = JankenGameInProgress.getMyGame(request.user_id)
            if game is None:
                raise Exception("You are not part of a game")
            if (JankenGameInProgress.getMyGame(request.user_id).game_finished == False):
                raise Exception("The game is not finished yet")
            return JsonResponse({'message': 'still waiting'})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

import time

class waitForOpponentAPIView(APIView): #waiting for a user to join your game, get the game he creater when he joined your game
    def get(self, request, *args, **kwargs):
        try:
            if (JankenGameCreation.objects.filter(creator=request.user_id).exists() == True):
                if (JankenGameCreation.objects.get(creator=request.user_id).isWaiting == True):
                    raise Exception("You already have a game creation waiting for an opponent")
                JankenGameCreation.objects.get(creator=request.user_id).isWaiting = True
                JankenGameCreation.objects.get(creator=request.user_id).save()
            if (JankenGameInProgress.myGame(request.user_id).exists() == False):
                raise Exception("No opponent found")
            game = JankenGameInProgress.objects.get(creator=request.user_id)
            return JsonResponse({'opponent': game.opponent})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})


class getResultsAPIView(APIView): #get the results of the game
    def get(self, request, *args, **kwargs):
        try:
            game = JankenGameInProgress.getMyGame(request.user_id)
            if game is None:
                raise Exception('You are not part of a game')
            #get winner
            if game.creator_choice == game.opponent_choice: #draw
                game.result = "draw"
            elif game.creator_choice == "rock":
                if game.opponent_choice == "scissors":
                    game.result = game.creator
                elif game.opponent_choice == "paper":
                    game.result = game.opponent
            elif game.creator_choice == "paper":
                if game.opponent_choice == "rock":
                    game.result = game.creator
                elif game.opponent_choice == "scissors":
                    game.result = game.opponent
            elif game.creator_choice == "scissors":
                if game.opponent_choice == "paper":
                    game.result = game.creator
                elif game.opponent_choice == "rock":
                    game.result = game.opponent
            #get loser and winner based on result==creator or result==opponent
            if game.result == game.creator:
                game.winner = game.creator
                game.loser = game.opponent
            if game.result == game.opponent:
                game.winner = game.opponent
                game.loser = game.creator
            if game.result != "draw" and game.result != "won by forfeit":
                game.result = "won"
            game.save()
            results = {'message': 'success', 'creator': game.creator, 'opponent': game.opponent, 'creator_choice': game.creator_choice, \
                    'opponent_choice': game.opponent_choice, 'result': game.result, 'loser': game.loser, 'winner': game.winner, 'myself':request.user_id}
            #give your permission to have the game deleted
            if request.user_id == game.creator:
                game.to_delete_creator = True
                game.save()
            if request.user_id == game.opponent:
                game.to_delete_opponent = True
                game.save()
            #delete if both gave permission
            if game.to_delete_creator == True and game.to_delete_opponent == True:
                game.addToHistory()
            return JsonResponse(results)
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

class deleteMyJankenGameCreationAPIView(APIView): #cancel a game creatoin
    def get(self, request, *args, **kwargs):
        try:
            game = JankenGameCreation.getMyGameCreation(request.user_id)
            if game:
                game.delete()
            return JsonResponse({'message': 'success'})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

from django.utils import timezone

class amIPlayingAPIView(APIView): #check if you are playing a game
    def get(self, request, *args, **kwargs):
        try:
            game = JankenGameInProgress.getMyGame(request.user_id)
            if game is not None:
                if game.game_finished == True:
                    if (timezone.now() - game.completion_time).total_seconds() > 20:
                        game.addToHistory()
                        raise Exception('You are not playing a game')
                    return JsonResponse({'message': 'The game is finished'})
                if game.first_input_time != None:
                    if (timezone.now() - game.first_input_time).total_seconds() > 300:
                        game.completion_time = timezone.now()
                        game.game_finished = True
                        game.result = "won by forfeit"
                        game.winner = game.first_input_nickname
                        game.loser = game.creator
                        if game.winner == game.creator:
                            game.loser = game.opponent
                        game.save()
                        raise Exception('You are not playing a game')
                if game.creator == request.user_id:
                    if game.creator_choice == "None":
                        return JsonResponse({'message': 'Waiting for your input'})
                    return JsonResponse({'message': 'Waiting for your opponent to play'})
                if game.opponent == request.user_id:
                    if game.opponent_choice == "None":
                        return JsonResponse({'message': 'Waiting for your input'})
                    return JsonResponse({'message': 'Waiting for your opponent to play'})
            if JankenGameCreation.getMyGameCreation(request.user_id) is not None:
                return JsonResponse({'message': 'You are waiting for an opponent'})
            raise Exception('You are not playing a game')
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})
from django.contrib.auth.decorators import login_required

class jankenHistoryAPIView(APIView): #get the history of your games
    def get(self, request, *args, **kwargs):
        try:
            games = FinishedJankenGames.objects.filter(owner=request.user_id)
            if games.exists() == False:
                raise Exception('You never played a game !')
            history = []
            for game in games:
                history.append({'opponent': game.opponent,\
                                'opponent_choice': game.opponent_choice, \
                                'owner': game.owner, \
                                'owner_choice': game.owner_choice, \
                                'result': game.result, \
                                'end_day': game.completion_time.astimezone(timezone.get_current_timezone()).strftime("%d/%m"), \
                                'end_time': game.completion_time.astimezone(timezone.get_current_timezone()).strftime("%H:%M:%S"), \
                                'winner': game.winner, \
                                        })
            return JsonResponse({'history': history, \
                                    'wins': FinishedJankenGames.countWins(request.user_id), \
                                    'draws': FinishedJankenGames.countDraws(request.user_id), \
                                    'losses': FinishedJankenGames.countLosses(request.user_id),
                                    'winrate': "{:.1f}%".format(FinishedJankenGames.getWinrate(request.user_id)),
                                    'most_played': FinishedJankenGames.getMostPlayed(request.user_id),
                                    })
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})
        
class getFriendStatsAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            friend_id = request.data.get('friend_id', 'undefined')
            if friend_id == 'undefined':
                raise Exception('Please provide a valid friend_id')
            games = FinishedJankenGames.objects.filter(owner=friend_id)
            if games.exists() == False:
                raise Exception('Your friend never played a game !')
            history = []
            for game in games:
                history.append({'opponent': game.opponent,\
                                'opponent_choice': game.opponent_choice, \
                                'owner': game.owner, \
                                'owner_choice': game.owner_choice, \
                                'result': game.result, \
                                'end_day': game.completion_time.astimezone(timezone.get_current_timezone()).strftime("%d/%m"), \
                                'end_time': game.completion_time.astimezone(timezone.get_current_timezone()).strftime("%H:%M:%S"), \
                                'winner': game.winner, \
                                        })
            return JsonResponse({'history': history,
                                'wins': FinishedJankenGames.countWins(friend_id),
                                'losses': FinishedJankenGames.countLosses(friend_id),
                                'draws': FinishedJankenGames.countDraws(friend_id),
                                'winrate': "{:.1f}%".format(FinishedJankenGames.getWinrate(friend_id))}) 
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})
