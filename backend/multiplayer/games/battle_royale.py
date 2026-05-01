from typing import Dict, Any, Tuple, Optional, List
from backend.config import BR_MIN_PLAYERS, BR_MAX_PLAYERS, BR_ROUND_DURATION, BR_PAUSE_BETWEEN_ROUNDS
from backend.services.offer_pool import get_normalized_job
from backend.multiplayer.base import BaseGame, GameRoom, GameState, Player


class BattleRoyaleGame(BaseGame):
    """Mode de jeu Battle Royale"""
    
    @property
    def game_type(self) -> str:
        return "battle_royale"
    
    @property
    def min_players(self) -> int:
        return BR_MIN_PLAYERS
    
    @property
    def max_players(self) -> int:
        return BR_MAX_PLAYERS
    
    @property
    def round_duration(self) -> int:
        return BR_ROUND_DURATION
    
    @property
    def pause_between_rounds(self) -> int:
        return BR_PAUSE_BETWEEN_ROUNDS
    
    def can_start(self, room: GameRoom) -> Tuple[bool, str]:
        if len(room.players) < self.min_players:
            return False, f"Minimum {self.min_players} joueurs requis"
        return True, ""
    
    def on_game_start(self, room: GameRoom) -> Dict[str, Any]:
        """Démarre la partie"""
        room.game_data = {
            "round": 1,
            "guesses": {},
            "current_offer": get_normalized_job()
        }
        print(f"[BATTLE] Partie démarrée avec offre: {room.game_data['current_offer'].get('intitule')}")
        print(f"[BATTLE] Salaire: {room.game_data['current_offer'].get('salary_real')} €")
        return {"offer": room.game_data["current_offer"]}
    
    def on_round_start(self, room: GameRoom) -> Dict[str, Any]:
        """Démarre un round"""
        room.game_data["guesses"] = {}
        return {"duration": self.round_duration}
    
    def on_player_action(self, room: GameRoom, player_id: str, action: str, data: Any) -> Tuple[bool, Optional[Dict]]:
        """Traite l'action d'un joueur (soumettre une estimation)"""
        if action != "submit_guess":
            return False, None
        
        if room.game_state != GameState.PLAYING:
            return False, None
        
        player = room.get_player(player_id)
        if not player or not player.is_alive:
            return False, None
        
        guess = data.get("guess")
        if not guess or not isinstance(guess, (int, float)):
            return False, None
        
        if player_id in room.game_data["guesses"]:
            return False, None
        
        room.game_data["guesses"][player_id] = int(guess)
        print(f"[BATTLE] {player.name} a deviné {guess}")
        
        return True, {"player_id": player_id, "guess": guess}
    
    def on_round_end(self, room: GameRoom) -> Dict[str, Any]:
        """Calcule les résultats du round"""
        current_offer = room.game_data["current_offer"]
        real_salary = current_offer.get("salary_real", 0)
        
        print(f"[BATTLE] Fin du round {room.game_data['round']}")
        print(f"[BATTLE] Salaire réel: {real_salary} €")
        
        alive_players = room.get_alive_players()
        
        results = []
        for player in alive_players:
            guess = room.game_data["guesses"].get(player.id)
            if guess is None:
                error = float('inf')
                guess_value = 0
            else:
                error = abs(guess - real_salary)
                guess_value = guess
            
            results.append({
                "player_id": player.id,
                "name": player.name,
                "guess": guess_value,
                "error": error
            })
        
        # Trier par erreur décroissante
        results.sort(key=lambda x: x["error"], reverse=True)
        
        # Éliminer le joueur avec la plus grande erreur
        eliminated = results[0]
        eliminated_player = room.get_player(eliminated["player_id"])
        if eliminated_player:
            eliminated_player.is_alive = False
            print(f"[BATTLE] {eliminated_player.name} est éliminé (erreur: {eliminated['error']})")
        
        current_round = room.game_data["round"]
        
        # Préparer le prochain round
        room.game_data["round"] += 1
        room.game_data["current_offer"] = get_normalized_job()
        room.game_data["guesses"] = {}
        
        return {
            "results": results,
            "eliminated_id": eliminated["player_id"],
            "eliminated_name": eliminated["name"],
            "eliminated_error": eliminated["error"],
            "real_salary": real_salary,
            "round": current_round
        }
    
    def on_game_over(self, room: GameRoom) -> Dict[str, Any]:
        """Vérifie si la partie est terminée et retourne le vainqueur"""
        alive_players = room.get_alive_players()
        
        if len(alive_players) <= 1:
            winner = alive_players[0].name if alive_players else None
            print(f"[BATTLE] Partie terminée! Vainqueur: {winner}")
            return {
                "is_over": True,
                "winner": winner
            }
        
        return {"is_over": False}
    
    def get_room_state(self, room: GameRoom) -> Dict[str, Any]:
        """Retourne l'état public de la salle"""
        return {
            "round": room.game_data.get("round", 0),
            "current_offer": room.game_data.get("current_offer"),
            "round_duration": self.round_duration
        }