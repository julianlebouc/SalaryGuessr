import time
import random
from typing import Dict, Optional, Tuple, List
from .base import GameRoom, Player, BaseGame


class RoomManager:
    """Gestionnaire générique des salles de jeu"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._rooms = {}
            cls._instance._games = {}
        return cls._instance
    
    def register_game(self, game: BaseGame) -> None:
        """Enregistre un mode de jeu"""
        self._games[game.game_type] = game
        print(f"[ROOM] Mode de jeu enregistré: {game.game_type}")
    
    def generate_room_code(self) -> str:
        """Génère un code de salle unique"""
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        while True:
            code = ''.join(random.choices(chars, k=6))
            if code not in self._rooms:
                return code
    
    def create_room(self, game_type: str, host_name: str, host_sid: str) -> Tuple[str, str]:
        """
        Crée une nouvelle salle.
        Retourne (code_salle, id_joueur_hote)
        """
        game = self._games.get(game_type)
        if not game:
            raise ValueError(f"Mode de jeu inconnu: {game_type}")
        
        code = self.generate_room_code()
        player_id = str(Player().id)
        
        room = GameRoom(
            code=code,
            game_type=game_type,
            host_id=player_id,
            host_sid=host_sid,
            host_name=host_name
        )
        
        host_player = Player(id=player_id, name=host_name, sid=host_sid)
        room.add_player(host_player)
        
        self._rooms[code] = room
        
        print(f"[ROOM] Salle {code} créée pour {game_type} par {host_name}")
        return code, player_id
    
    def join_room(self, code: str, player_name: str, sid: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Ajoute un joueur à une salle.
        Retourne (id_joueur, message_erreur)
        """
        room = self._rooms.get(code)
        if not room:
            return None, "Salle introuvable"
        
        game = self._games.get(room.game_type)
        if not game:
            return None, "Mode de jeu invalide"
        
        if room.game_state.value != "waiting":
            return None, "La partie a déjà commencé"
        
        if len(room.players) >= game.max_players:
            return None, f"Salle pleine (max {game.max_players})"
        
        player = Player(name=player_name, sid=sid)
        room.add_player(player)
        
        print(f"[ROOM] {player_name} a rejoint {code} ({len(room.players)}/{game.max_players})")
        return player.id, None
    
    def get_room(self, code: str) -> Optional[GameRoom]:
        return self._rooms.get(code)
    
    def get_room_state(self, code: str) -> Optional[Dict]:
        """Retourne l'état public d'une salle"""
        room = self._rooms.get(code)
        if not room:
            return None
        
        game = self._games.get(room.game_type)
        if not game:
            return None
        
        return {
            "code": room.code,
            "game_type": room.game_type,
            "players": room.get_players_list(),
            "game_state": room.game_state.value,
            "min_players": game.min_players,
            "max_players": game.max_players,
            "host_id": room.host_id,
            "host_name": room.host_name,
            **game.get_room_state(room)
        }
    
    def remove_player(self, code: str, player_id: str) -> None:
        """Retire un joueur d'une salle"""
        room = self._rooms.get(code)
        if room:
            room.remove_player(player_id)
            print(f"[ROOM] Joueur {player_id} a quitté {code}")
            
            # Si la salle est vide, la supprimer
            if len(room.players) == 0:
                del self._rooms[code]
                print(f"[ROOM] Salle {code} supprimée (vide)")
    
    def get_game(self, code: str) -> Optional[BaseGame]:
        room = self._rooms.get(code)
        if not room:
            return None
        return self._games.get(room.game_type)
    
    def get_room_by_sid(self, sid: str) -> Optional[Tuple[str, GameRoom]]:
        """Trouve la salle contenant un joueur par son SID"""
        for code, room in self._rooms.items():
            for player in room.players.values():
                if player.sid == sid:
                    return code, room
        return None


# Singleton
_room_manager = None

def get_room_manager() -> RoomManager:
    global _room_manager
    if _room_manager is None:
        _room_manager = RoomManager()
    return _room_manager