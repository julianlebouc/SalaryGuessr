"""
Global Room Manager for handling multiplayer game sessions.
Implements a singleton pattern to manage game rooms and types.
"""

import time
import random
from typing import Dict, Optional, Tuple, List
from .base import GameRoom, Player, BaseGame


class RoomManager:
    """
    Generic manager for game rooms.
    Handles creation, joining, and state retrieval for multiplayer sessions.
    """
    
    _instance = None
    
    def __new__(cls):
        """
        Singleton implementation for RoomManager.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._rooms = {}
            cls._instance._games = {}
        return cls._instance
    
    def register_game(self, game: BaseGame) -> None:
        """
        Register a game mode into the manager.
        
        Args:
            game (BaseGame): An instance of a game class inheriting from BaseGame.
        """
        self._games[game.game_type] = game
        print(f"[ROOM] Game mode registered: {game.game_type}")
    
    def generate_room_code(self) -> str:
        """
        Generate a unique 6-character uppercase alphanumeric room code.
        
        Returns:
            str: A unique room code.
        """
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        while True:
            code = ''.join(random.choices(chars, k=6))
            if code not in self._rooms:
                return code
    
    def create_room(self, game_type: str, host_name: str, host_sid: str) -> Tuple[str, str]:
        """
        Create a new game room.
        
        Args:
            game_type (str): The registered type of game to play.
            host_name (str): Display name of the host player.
            host_sid (str): Socket ID of the host.
            
        Returns:
            Tuple[str, str]: A tuple containing (room_code, host_player_id).
            
        Raises:
            ValueError: If the game_type is not registered.
        """
        game = self._games.get(game_type)
        if not game:
            raise ValueError(f"Unknown game mode: {game_type}")
        
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
        
        print(f"[ROOM] Room {code} created for {game_type} by {host_name}")
        return code, player_id
    
    def join_room(self, code: str, player_name: str, sid: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Add a player to an existing room.
        
        Args:
            code (str): The room code.
            player_name (str): Display name of the joining player.
            sid (str): Socket ID of the joining player.
            
        Returns:
            Tuple[Optional[str], Optional[str]]: (player_id, error_message). 
            If player_id is None, error_message contains the reason.
        """
        if isinstance(code, str):
            code = code.strip().upper()
        room = self._rooms.get(code)
        if not room:
            return None, "Room not found"
        
        game = self._games.get(room.game_type)
        if not game:
            return None, "Invalid game mode"
        
        if room.game_state.value != "waiting":
            return None, "Game has already started"
        
        if len(room.players) >= game.max_players:
            return None, f"Room full (max {game.max_players})"
        
        player = Player(name=player_name, sid=sid)
        room.add_player(player)
        
        print(f"[ROOM] {player_name} joined {code} ({len(room.players)}/{game.max_players})")
        return player.id, None
    
    def get_room(self, code: str) -> Optional[GameRoom]:
        """
        Retrieve a GameRoom object by its code.
        
        Args:
            code (str): The room code.
            
        Returns:
            Optional[GameRoom]: The room instance if found.
        """
        if isinstance(code, str):
            code = code.strip().upper()
        return self._rooms.get(code)
    
    def get_room_state(self, code: str) -> Optional[Dict]:
        """
        Retrieve the public state of a room for synchronization with clients.
        
        Args:
            code (str): The room code.
            
        Returns:
            Optional[Dict]: A dictionary containing players, game state, and metadata.
        """
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
        """
        Remove a player from a room. Deletes the room if it becomes empty.
        
        Args:
            code (str): The room code.
            player_id (str): The unique identifier of the player.
        """
        room = self._rooms.get(code)
        if room:
            room.remove_player(player_id)
            print(f"[ROOM] Player {player_id} left {code}")
            
            # If the room is empty, delete it
            if len(room.players) == 0:
                del self._rooms[code]
                print(f"[ROOM] Room {code} deleted (empty)")
    
    def get_game(self, code: str) -> Optional[BaseGame]:
        """
        Get the game logic instance associated with a room.
        """
        room = self._rooms.get(code)
        if not room:
            return None
        return self._games.get(room.game_type)
    
    def get_room_by_sid(self, sid: str) -> Optional[Tuple[str, GameRoom]]:
        """
        Find the room containing a player by their Socket ID.
        
        Args:
            sid (str): The socket identifier.
            
        Returns:
            Optional[Tuple[str, GameRoom]]: (room_code, GameRoom instance) if found.
        """
        for code, room in self._rooms.items():
            for player in room.players.values():
                if player.sid == sid:
                    return code, room
        return None


# Singleton helper
_room_manager = None

def get_room_manager() -> RoomManager:
    """
    Get the global RoomManager singleton instance.
    """
    global _room_manager
    if _room_manager is None:
        _room_manager = RoomManager()
    return _room_manager