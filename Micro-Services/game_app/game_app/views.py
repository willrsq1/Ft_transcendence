import json, asyncio

import game_app.pong.constants as g
from game_app.pong.game_server import server
from django.http import JsonResponse
import json
from rest_framework.views import APIView
from django.http import JsonResponse
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.cache import never_cache
import time
from django.views.decorators.http import require_http_methods

async def stream_generator(game_id):
    while True:
        try:
            data = server.get_latest_snap(game_id)
            yield f"data: {json.dumps(data)}\n\n".encode("utf-8")
            await asyncio.sleep(g.SENDRATE)
        except asyncio.CancelledError:
            server.handle_disconnect(game_id)
            raise

@require_http_methods(["POST"])
def game_create_view(request):
    username = getattr(request, 'username', None)
    user_id = getattr(request, 'user_id', None)

    has_session = server.player_has_active_session(username)
    if has_session:
        return JsonResponse({"id": has_session}, status=200)

    return JsonResponse({"id": server.matchmaker(username, user_id)}, status=201)

@never_cache
@require_http_methods(["GET", "PUT"])
async def game_view(request, game_id):
    username = getattr(request, 'username', None)
    if username is None or not server.game_exists(game_id) or not server.player_is_in_session(game_id, username):
        return JsonResponse({"error": "Unauthorized access"}, status=403)

    if request.method == "GET":
        try:
            response = StreamingHttpResponse(stream_generator(game_id), content_type="text/event-stream")
        except asyncio.CancelledError:
            server.handle_disconnect(game_id)
            return JsonResponse({"error": "Game has ended."}, status=400)
        return response

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            if not (isinstance(data, list) and len(data) == 2):
                raise ValueError("Input must be a pair of [input, timestamp]")
        except (json.JSONDecodeError, ValueError) as e:
            return JsonResponse({"error": str(e)}, status=400)

        input_id, timestamp = data
        if input_id not in g.INPUTS:
            return JsonResponse({"error": "Invalid value for 'input'"}, status=400)

        server.create_input(game_id, username, input_id, timestamp)
        return JsonResponse({}, status=200)



from .models import FinishedPongGames
from django.utils import timezone

class pongHistoryAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            game = FinishedPongGames.objects.create(
                owner=request.user_id, \
                player1=request.data.get('player1', 'undefined'), \
                game_type=request.data.get('game_type', 'undefined'), \
                opponent=request.data.get('opponent', 'undefined'), \
                player_score=request.data.get('player_score', 'undefined'), \
                opponent_score=request.data.get('opponent_score', 'undefined'), \
                winner=request.data.get('winner', 'undefined'), \
                result=request.data.get('result', 'undefined'), \
                tourney_game=request.data.get('tourney_game', False), \
                completion_day= timezone.now().astimezone(timezone.get_current_timezone()).strftime("%d/%m"), \
                completion_time= timezone.now().astimezone(timezone.get_current_timezone()).strftime("%H:%M:%S"), \
            )
            return JsonResponse({'message': 'success', 'game_id': game.id})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

    def get(self, request, *args, **kwargs):
        try:
            games = FinishedPongGames.objects.filter(owner=request.user_id)
            if games.exists() == False:
                raise Exception('You never played a game !')
            history = []
            for game in games:
                if game.game_type != 'tournament':
                    history.append({'owner': game.owner, \
                                'game_type': game.game_type, \
                                'opponent': game.opponent, \
                                'player_score': game.player_score, \
                                'opponent_score': game.opponent_score, \
                                'winner': game.winner, \
                                'result': game.result, \
                                'end_day': game.completion_day, \
                                'end_time': game.completion_time, \
                                        })
            return JsonResponse({'history': history, \
                                'wins': FinishedPongGames.countWins(request.user_id), \
                                'losses': FinishedPongGames.countLosses(request.user_id),
                                'winrate': "{:.1f}%".format(FinishedPongGames.getWinrate(request.user_id))})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

class getFriendStatsAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            friend_id = request.data.get('friend_id', 'undefined')
            if friend_id == 'undefined':
                raise Exception('Please provide a valid friend_id')
            games = FinishedPongGames.objects.filter(owner=friend_id)
            if games.exists() == False:
                raise Exception('You never played a game !')
            history = []
            for game in games:
                if game.game_type != 'tournament':
                    history.append({'owner': game.owner, \
                                'game_type': game.game_type, \
                                'opponent': game.opponent, \
                                'player_score': game.player_score, \
                                'opponent_score': game.opponent_score, \
                                'winner': game.winner, \
                                'result': game.result, \
                                'end_day': game.completion_day, \
                                'end_time': game.completion_time, \
                                        })
            return JsonResponse({'history': history,
                                'wins': FinishedPongGames.countWins(friend_id),
                                'losses': FinishedPongGames.countLosses(friend_id),
                                'winrate': "{:.1f}%".format(FinishedPongGames.getWinrate(friend_id))})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})


from .models import tournament

class tournamentAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            game_round = request.data.get('game_round', 'undefined')
            if game_round == 'undefined':
                raise Exception('Please provide a valid game')
            if game_round == "1":
                tourney = tournament.objects.create(owner=request.user_id)
            else:
                tourney_id = request.data.get('tourney_id', 'undefined')
                tourney = tournament.objects.get(id=tourney_id)
            game_id = request.data.get('game_id', 'undefined')
            if game_round == "1":
                tourney.game1 = FinishedPongGames.objects.get(id=game_id)
            elif game_round == "2":
                tourney.game2 = FinishedPongGames.objects.get(id=game_id)
            elif game_round == "3":
                tourney.game3 = FinishedPongGames.objects.get(id=game_id)
                tourney.is_finished = True
            tourney.save()
            return JsonResponse({'message': 'success', 'tourney_id': tourney.id})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

    def get(self, request, *args, **kwargs):
        try:
            tourneys = tournament.objects.filter(owner=request.user_id, is_finished=True)
            if (tourneys.exists() == False):
                raise Exception('You never played a tournament !')
            history = []
            for tourney in tourneys:
                history.append({'id': tourney.id,
                                'player1': tourney.game1.player1, \
                                'player2': tourney.game1.opponent, \
                                'player3': tourney.game2.opponent, \
                                'player4': tourney.game2.player1, \
                                'winner': tourney.game3.winner})
            return JsonResponse({'history': history})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})

class tourneyHistoryAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            tourney = tournament.objects.get(id=request.data.get('tourney_id', 'undefined'))
            if tourney is None:
                raise Exception('Please provide a valid tourney_id')
            if tourney.owner != request.user_id:
                raise Exception('You haven\'t hosted a tournament with this id.')
            if tourney.is_finished == False:
                raise Exception('Tournament doesn\'t exist.')
            games = []
            games.append ({'game1_player1': tourney.game1.player1, \
                        'game1_player2': tourney.game1.opponent, \
                        'game1_winner': tourney.game1.winner, \
                        'game1_player1_score': tourney.game1.player_score, \
                        'game1_player2_score': tourney.game1.opponent_score, \
                        'game1_winner': tourney.game1.winner, \
                        'game1_loser': tourney.game1.opponent if tourney.game1.winner == tourney.game1.player1 else tourney.game1.player1, \
                        'game1_completion_day': tourney.game1.completion_day, \
                        'game1_completion_time': tourney.game1.completion_time, \
                        'game2_player1': tourney.game2.player1, \
                        'game2_player2': tourney.game2.opponent, \
                        'game2_winner': tourney.game2.winner, \
                        'game2_player1_score': tourney.game2.player_score, \
                        'game2_player2_score': tourney.game2.opponent_score, \
                        'game2_winner': tourney.game2.winner, \
                        'game2_loser': tourney.game2.opponent if tourney.game2.winner == tourney.game2.player1 else tourney.game2.player1, \
                        'game2_completion_day': tourney.game2.completion_day, \
                        'game2_completion_time': tourney.game2.completion_time, \
                        'game3_player1': tourney.game3.player1, \
                        'game3_player2': tourney.game3.opponent, \
                        'game3_winner': tourney.game3.winner, \
                        'game3_player1_score': tourney.game3.player_score, \
                        'game3_player2_score': tourney.game3.opponent_score, \
                        'game3_loser': tourney.game3.opponent if tourney.game3.winner == tourney.game3.player1 else tourney.game3.player1, \
                        'game3_completion_day': tourney.game3.completion_day, \
                        'game3_completion_time': tourney.game3.completion_time, \
                        'tournamentId': tourney.id
                                })
            return JsonResponse({'games': games})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})


class tourneyBlockchainKeyAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            tourney = tournament.objects.get(id=request.data.get('tourney_id', 'undefined'))
            if tourney is None:
                raise Exception('Please provide a valid tourney_id')
            if tourney.owner != request.user_id:
                raise Exception('You haven\'t hosted a tournament with this id.')
            if tourney.is_finished == False:
                raise Exception('Tournament doesn\'t exist.')
            tx = request.data.get('tx', 'undefined')
            if tx == 'undefined':
                raise Exception('please give a valid tx')
            tourney.tx = tx
            tourney.save()
            return JsonResponse({'message':'success'})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})
        
        
class tourneyTxAPIView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            tourney = tournament.objects.get(id=request.data.get('tourney_id', 'undefined'))
            if tourney is None:
                raise Exception('Please provide a valid tourney_id')
            if tourney.owner != request.user_id:
                raise Exception('You haven\'t hosted a tournament with this id.')
            if tourney.is_finished == False:
                raise Exception('Tournament doesn\'t exist.')
            return JsonResponse({'message':'success', 'tx':tourney.tx})
        except Exception as e:
            print(e)
            return JsonResponse({'error': e.args[0]})
        