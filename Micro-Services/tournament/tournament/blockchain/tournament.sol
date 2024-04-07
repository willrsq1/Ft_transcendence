// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DBTournament {
    address private owner;
    mapping(uint64 => bool) private tournamentExist;
    mapping(uint64 => Match[3]) private tournaments;

    struct Match{
        string score;
        string winner;
        string looser;
    }

    constructor() {
        owner = msg.sender;
    }

    function saveTournament(uint64 tournamentId, string[3] calldata _scores, string[3] calldata _winners, string[3] calldata _loosers) public onlyOwner {
        require(!tournamentExist[tournamentId], "This tournament already exists");
        
        for (uint8 i = 0; i < 3; i++) {
            Match memory newMatch = Match({
                score: _scores[i],
                winner: _winners[i],
                looser: _loosers[i]
            });
            tournaments[tournamentId][i] = newMatch;
        }
        
        tournamentExist[tournamentId] = true;
    }



    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action.");
        _;
    }

    function getTournament(uint64 tournamentId) public view returns(Match memory, Match memory, Match memory) {
        require(tournamentExist[tournamentId] == true, "This tournament doesn't exist");
        return(tournaments[tournamentId][0], tournaments[tournamentId][1], tournaments[tournamentId][2]);
    }
}