from web3 import Web3, HTTPProvider
from web3.middleware import geth_poa_middleware
from django.http import JsonResponse
from dotenv import load_dotenv
import os
import json
from django.views.decorators.http import require_http_methods


TOURNAMENT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
provider_url = os.getenv('PROVIDER_URL')
private_key = os.getenv('PRIVATE_KEY')


w3 = Web3(HTTPProvider(provider_url))

tournament_abi =[
    {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"uint64","name":"tournamentId","type":"uint64"},{"indexed":False,"internalType":"string","name":"score","type":"string"},{"indexed":False,"internalType":"string","name":"winner","type":"string"},{"indexed":False,"internalType":"string","name":"looser","type":"string"}],"name":"tournamentSaved","type":"event"},{"inputs":[{"internalType":"uint64","name":"tournamentId","type":"uint64"},{"internalType":"string[3]","name":"_scores","type":"string[3]"},{"internalType":"string[3]","name":"_winners","type":"string[3]"},{"internalType":"string[3]","name":"_loosers","type":"string[3]"}],"name":"saveTournament","outputs":[],"stateMutability":"nonpayable","type":"function"}
]
tournament_contract = w3.eth.contract(address=TOURNAMENT_ADDRESS, abi=tournament_abi)


@require_http_methods(["POST"])
def save_tournament(request):
    try:
        account = w3.eth.account.from_key("0x47caba476a9c0845d38242252b63cbb65654a80df9cfbd35659f87c44948ddfe")
        nonce = w3.eth.get_transaction_count(account.address)

        data = json.loads(request.body)
        dataScore = (f"Match 1: {data['game1_player1_score']}-{data['game1_player2_score']}",f"Match2: {data['game2_player1_score']}-{data['game2_player2_score']}", f"Finale : {data['game3_player1_score']}-{data['game3_player2_score']}")
        dataWinner = (f"Winner : {data['game1_winner']}", f"Winner : {data['game2_winner']}", f"Winner : {data['game3_winner']}")
        dataLoser = (f"Loser : {data['game1_loser']}", f"Loser : {data['game2_loser']}", f"Loser : {data['game3_loser']}")

        tx = tournament_contract.functions.saveTournament(data['tournamentId'], dataScore, dataWinner, dataLoser).build_transaction({
            'from': account.address,
            'chainId': 421614,
            'gas': 2000000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': nonce,
        })

        signed_tx = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        print(f"Transaction soumise : {tx_hash.hex()}")
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        tx = receipt.transactionHash.hex()
        print(f"Transaction confirmée : ", tx)
        return JsonResponse({'message': 'success', 'tx': tx})
    except Exception as e:
            print(e)
            return JsonResponse({'error': "Failed to save tournament un blockchain: " + e.args[0]})
    